/**
 * API Service Layer — Supabase data CRUD for CourseForge.
 * Provides functions for courses, videos, modules, notes, bookmarks,
 * progress, community features (follow, rate, publish).
 * 
 * Falls back to localStorage when Supabase is unavailable or user is not logged in.
 */

import { getSupabase, authService } from './supabase';
import type { Course, Video, Module, Note, Bookmark } from '../types';

// ============================================================================
// Helper: get current user ID
// ============================================================================
function getUserId(): string | null {
  return authService.getUser()?.id || null;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUUID(str: string | undefined | null): boolean {
  if (!str) return false;
  return UUID_REGEX.test(str);
}

/** Ensure profile row exists in public.profiles for the logged in user */
async function ensureUserProfile(userId: string): Promise<void> {
  const user = authService.getUser();
  if (!user) return;
  try {
    const supabase = getSupabase();
    await supabase.from('profiles').upsert({
      id: userId,
      name: user.name || user.email.split('@')[0],
      email: user.email,
      avatar_url: user.avatarUrl || '',
    }, { onConflict: 'id' });
  } catch (err) {
    console.warn('ensureUserProfile warning:', err);
  }
}

// ============================================================================
// COURSES
// ============================================================================

/** Fetch courses authored by the current user */
export async function fetchMyCourses(): Promise<Course[]> {
  const userId = getUserId();
  if (!userId) return [];

  try {
    const supabase = getSupabase();
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .eq('author_id', userId)
      .order('last_opened_at', { ascending: false });

    if (error) throw error;
    if (!courses || courses.length === 0) return [];

    // Fetch videos + modules for each course
    const courseIds = courses.map((c: any) => c.id);
    
    const [{ data: videos }, { data: modules }] = await Promise.all([
      supabase.from('videos').select('*').in('course_id', courseIds).order('order', { ascending: true }),
      supabase.from('modules').select('*').in('course_id', courseIds).order('order', { ascending: true }),
    ]);

    // Fetch user progress for these videos
    const videoIds = (videos || []).map((v: any) => v.id);
    let progressMap: Record<string, { is_completed: boolean; completed_at: string | null }> = {};
    if (videoIds.length > 0) {
      const { data: progress } = await supabase
        .from('user_video_progress')
        .select('video_id, is_completed, completed_at')
        .eq('user_id', userId)
        .in('video_id', videoIds);
      
      for (const p of progress || []) {
        progressMap[p.video_id] = { is_completed: p.is_completed, completed_at: p.completed_at };
      }
    }

    return courses.map((c: any) => dbCourseToApp(c, videos || [], modules || [], progressMap));
  } catch (err) {
    console.error('fetchMyCourses error:', err);
    return [];
  }
}

/** Fetch public courses for community hub */
export async function fetchPublicCourses(category?: string): Promise<Course[]> {
  try {
    const supabase = getSupabase();
    let query = supabase
      .from('courses')
      .select('*, profiles!courses_author_id_fkey(name, avatar_url)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    const { data: courses, error } = await query;
    if (error) throw error;
    if (!courses) return [];

    const courseIds = courses.map((c: any) => c.id);
    const [{ data: videos }, { data: modules }, { data: followers }, { data: ratings }] = await Promise.all([
      supabase.from('videos').select('*').in('course_id', courseIds).order('order', { ascending: true }),
      supabase.from('modules').select('*').in('course_id', courseIds).order('order', { ascending: true }),
      supabase.from('course_followers').select('course_id').in('course_id', courseIds),
      supabase.from('course_ratings').select('course_id, rating').in('course_id', courseIds),
    ]);

    // Count followers per course
    const followerCounts: Record<string, number> = {};
    for (const f of followers || []) {
      followerCounts[f.course_id] = (followerCounts[f.course_id] || 0) + 1;
    }

    // Average rating per course
    const ratingMap: Record<string, { sum: number; count: number }> = {};
    for (const r of ratings || []) {
      if (!ratingMap[r.course_id]) ratingMap[r.course_id] = { sum: 0, count: 0 };
      ratingMap[r.course_id].sum += r.rating;
      ratingMap[r.course_id].count += 1;
    }

    return courses.map((c: any) => {
      const course = dbCourseToApp(c, videos || [], modules || [], {});
      course.authorName = c.profiles?.name || 'Unknown';
      course.authorAvatar = c.profiles?.avatar_url || '';
      course.followersCount = followerCounts[c.id] || 0;
      const r = ratingMap[c.id];
      course.rating = r ? Math.round((r.sum / r.count) * 10) / 10 : 0;
      return course;
    });
  } catch (err) {
    console.error('fetchPublicCourses error:', err);
    return [];
  }
}

/** Create a new course with its videos and modules */
export async function createCourse(course: Course): Promise<Course | null> {
  const userId = getUserId();
  if (!userId) return null;

  try {
    await ensureUserProfile(userId);
    const supabase = getSupabase();

    // Insert course
    const { data: dbCourse, error: courseErr } = await supabase
      .from('courses')
      .insert({
        author_id: userId,
        title: course.title,
        description: course.description,
        thumbnail_url: course.thumbnailUrl,
        channel_name: course.channelName,
        category: course.category,
        tags: course.tags,
        is_public: course.isPublic || false,
        target_days: course.targetDays || 30,
      })
      .select()
      .single();

    if (courseErr) throw courseErr;

    // Insert modules
    const moduleIdMap: Record<string, string> = {};
    if (course.modules && course.modules.length > 0) {
      const modulesInsert = course.modules.map((m) => ({
        course_id: dbCourse.id,
        title: m.title,
        description: m.description || '',
        order: m.order,
      }));

      const { data: dbModules, error: modErr } = await supabase
        .from('modules')
        .insert(modulesInsert)
        .select();

      if (modErr) throw modErr;

      // Map old module IDs to new DB UUIDs
      for (let i = 0; i < course.modules.length; i++) {
        if (dbModules?.[i]) {
          moduleIdMap[course.modules[i].id] = dbModules[i].id;
        }
      }
    }

    // Insert videos
    if (course.videos && course.videos.length > 0) {
      const videosInsert = course.videos.map((v) => ({
        course_id: dbCourse.id,
        module_id: v.moduleId ? moduleIdMap[v.moduleId] || null : null,
        youtube_id: v.youtubeId,
        title: v.title,
        duration: v.duration,
        duration_formatted: v.durationFormatted,
        thumbnail_url: v.thumbnailUrl,
        channel_name: v.channelName,
        description: v.description,
        order: v.order,
      }));

      const { error: vidErr } = await supabase.from('videos').insert(videosInsert);
      if (vidErr) throw vidErr;
    }

    // Refetch the complete course
    const fullCourse = await fetchCourseById(dbCourse.id);
    return fullCourse;
  } catch (err) {
    console.error('createCourse error:', err);
    return null;
  }
}

/** Fetch a single course by ID */
export async function fetchCourseById(courseId: string): Promise<Course | null> {
  const userId = getUserId();

  try {
    const supabase = getSupabase();
    const { data: course, error } = await supabase
      .from('courses')
      .select('*, profiles!courses_author_id_fkey(name, avatar_url)')
      .eq('id', courseId)
      .single();

    if (error) throw error;
    if (!course) return null;

    const [{ data: videos }, { data: modules }] = await Promise.all([
      supabase.from('videos').select('*').eq('course_id', courseId).order('order', { ascending: true }),
      supabase.from('modules').select('*').eq('course_id', courseId).order('order', { ascending: true }),
    ]);

    let progressMap: Record<string, { is_completed: boolean; completed_at: string | null }> = {};
    if (userId && videos && videos.length > 0) {
      const videoIds = videos.map((v: any) => v.id);
      const { data: progress } = await supabase
        .from('user_video_progress')
        .select('video_id, is_completed, completed_at')
        .eq('user_id', userId)
        .in('video_id', videoIds);
      
      for (const p of progress || []) {
        progressMap[p.video_id] = { is_completed: p.is_completed, completed_at: p.completed_at };
      }
    }

    const result = dbCourseToApp(course, videos || [], modules || [], progressMap);
    result.authorName = course.profiles?.name || '';
    result.authorAvatar = course.profiles?.avatar_url || '';
    return result;
  } catch (err) {
    console.error('fetchCourseById error:', err);
    return null;
  }
}

/** Update course metadata */
export async function updateCourse(course: Course): Promise<void> {
  const userId = getUserId();
  if (!userId) return;

  try {
    const supabase = getSupabase();
    await supabase
      .from('courses')
      .update({
        title: course.title,
        description: course.description,
        thumbnail_url: course.thumbnailUrl,
        category: course.category,
        tags: course.tags,
        is_public: course.isPublic || false,
        is_favorite: course.isFavorite || false,
        is_archived: course.isArchived || false,
        target_days: course.targetDays,
        updated_at: new Date().toISOString(),
        last_opened_at: new Date().toISOString(),
      })
      .eq('id', course.id)
      .eq('author_id', userId);
  } catch (err) {
    console.error('updateCourse error:', err);
  }
}

/** Save video completion progress to Supabase */
export async function saveVideoProgress(courseId: string, videoId: string, isCompleted: boolean): Promise<void> {
  const userId = getUserId();
  if (!userId || !isUUID(courseId) || !isUUID(videoId)) return;

  try {
    const supabase = getSupabase();
    await supabase.from('user_video_progress').upsert({
      user_id: userId,
      course_id: courseId,
      video_id: videoId,
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,video_id' });
  } catch (err) {
    console.warn('saveVideoProgress error:', err);
  }
}

/** Toggle publish/unpublish a course */
export async function togglePublishCourse(courseId: string, isPublic: boolean): Promise<void> {
  const userId = getUserId();
  if (!userId) return;

  try {
    const supabase = getSupabase();
    await supabase
      .from('courses')
      .update({ is_public: isPublic, updated_at: new Date().toISOString() })
      .eq('id', courseId)
      .eq('author_id', userId);
  } catch (err) {
    console.error('togglePublishCourse error:', err);
  }
}

/** Delete a course from Supabase */
export async function deleteCourse(courseId: string): Promise<void> {
  const userId = getUserId();
  if (!userId) return;

  try {
    const supabase = getSupabase();
    await supabase.from('courses').delete().eq('id', courseId).eq('author_id', userId);
  } catch (err) {
    console.error('deleteCourse error:', err);
  }
}

// ============================================================================
// VIDEOS & MODULES
// ============================================================================

/** Update video module assignment (drag-drop) */
export async function updateVideoModule(videoId: string, moduleId: string | null): Promise<void> {
  try {
    const supabase = getSupabase();
    await supabase
      .from('videos')
      .update({ module_id: moduleId })
      .eq('id', videoId);
  } catch (err) {
    console.error('updateVideoModule error:', err);
  }
}

/** Create a new module */
export async function createModule(courseId: string, title: string, order: number): Promise<Module | null> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('modules')
      .insert({ course_id: courseId, title, order })
      .select()
      .single();

    if (error) throw error;
    return { id: data.id, title: data.title, description: data.description, order: data.order };
  } catch (err) {
    console.error('createModule error:', err);
    return null;
  }
}

/** Delete a module */
export async function deleteModule(moduleId: string): Promise<void> {
  try {
    const supabase = getSupabase();
    // Unassign videos first
    await supabase.from('videos').update({ module_id: null }).eq('module_id', moduleId);
    await supabase.from('modules').delete().eq('id', moduleId);
  } catch (err) {
    console.error('deleteModule error:', err);
  }
}

// ============================================================================
// VIDEO PROGRESS
// ============================================================================

/** Toggle video completion */
export async function toggleVideoCompletion(videoId: string, courseId: string, isCompleted: boolean): Promise<void> {
  const userId = getUserId();
  if (!userId) return;

  try {
    const supabase = getSupabase();
    await supabase
      .from('user_video_progress')
      .upsert({
        user_id: userId,
        video_id: videoId,
        course_id: courseId,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,video_id' });
  } catch (err) {
    console.error('toggleVideoCompletion error:', err);
  }
}

// ============================================================================
// NOTES
// ============================================================================

/** Fetch notes for the current user */
export async function fetchMyNotes(courseId?: string): Promise<Note[]> {
  const userId = getUserId();
  if (!userId) return [];

  try {
    const supabase = getSupabase();
    let query = supabase.from('notes').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (courseId) query = query.eq('course_id', courseId);

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((n: any) => ({
      id: n.id,
      courseId: n.course_id,
      videoId: n.video_id,
      timestamp: n.timestamp,
      timestampFormatted: n.timestamp_formatted,
      title: n.title,
      content: n.content,
      tags: n.tags || [],
      createdAt: n.created_at,
      updatedAt: n.updated_at,
      isFavorite: n.is_favorite,
    }));
  } catch (err) {
    console.error('fetchMyNotes error:', err);
    return [];
  }
}

/** Create a note */
export async function createNote(note: Note): Promise<Note | null> {
  const userId = getUserId();
  if (!userId || !isUUID(note.courseId)) return note;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        course_id: note.courseId,
        video_id: isUUID(note.videoId) ? note.videoId : null,
        timestamp: note.timestamp,
        timestamp_formatted: note.timestampFormatted,
        title: note.title,
        content: note.content,
        tags: note.tags,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      courseId: data.course_id,
      videoId: data.video_id,
      timestamp: data.timestamp,
      timestampFormatted: data.timestamp_formatted,
      title: data.title,
      content: data.content,
      tags: data.tags || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.warn('createNote warning:', err);
    return note;
  }
}

/** Delete a note */
export async function deleteNote(noteId: string): Promise<void> {
  const userId = getUserId();
  if (!userId) return;

  try {
    const supabase = getSupabase();
    await supabase.from('notes').delete().eq('id', noteId).eq('user_id', userId);
  } catch (err) {
    console.error('deleteNote error:', err);
  }
}

// ============================================================================
// BOOKMARKS
// ============================================================================

export async function fetchMyBookmarks(courseId?: string): Promise<Bookmark[]> {
  const userId = getUserId();
  if (!userId) return [];

  try {
    const supabase = getSupabase();
    let query = supabase.from('bookmarks').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (courseId) query = query.eq('course_id', courseId);

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((b: any) => ({
      id: b.id,
      courseId: b.course_id,
      videoId: b.video_id,
      videoTitle: b.video_title,
      timestamp: b.timestamp,
      timestampFormatted: b.timestamp_formatted,
      label: b.label,
      note: b.note,
      createdAt: b.created_at,
    }));
  } catch (err) {
    console.error('fetchMyBookmarks error:', err);
    return [];
  }
}

export async function createBookmark(bookmark: Bookmark): Promise<Bookmark | null> {
  const userId = getUserId();
  if (!userId || !isUUID(bookmark.courseId) || !isUUID(bookmark.videoId)) return bookmark;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: userId,
        course_id: bookmark.courseId,
        video_id: bookmark.videoId,
        video_title: bookmark.videoTitle,
        timestamp: bookmark.timestamp,
        timestamp_formatted: bookmark.timestampFormatted,
        label: bookmark.label,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      courseId: data.course_id,
      videoId: data.video_id,
      videoTitle: data.video_title,
      timestamp: data.timestamp,
      timestampFormatted: data.timestamp_formatted,
      label: data.label,
      createdAt: data.created_at,
    };
  } catch (err) {
    console.warn('createBookmark warning:', err);
    return bookmark;
  }
}

/** Delete a bookmark */
export async function deleteBookmark(bookmarkId: string): Promise<void> {
  const userId = getUserId();
  if (!userId) return;

  try {
    const supabase = getSupabase();
    await supabase.from('bookmarks').delete().eq('id', bookmarkId).eq('user_id', userId);
  } catch (err) {
    console.error('deleteBookmark error:', err);
  }
}

// ============================================================================
// COMMUNITY: Follow / Rate
// ============================================================================

export async function followCourse(courseId: string): Promise<void> {
  const userId = getUserId();
  if (!userId) return;

  try {
    const supabase = getSupabase();
    await supabase.from('course_followers').insert({ user_id: userId, course_id: courseId });
  } catch (err) {
    console.error('followCourse error:', err);
  }
}

export async function unfollowCourse(courseId: string): Promise<void> {
  const userId = getUserId();
  if (!userId) return;

  try {
    const supabase = getSupabase();
    await supabase.from('course_followers').delete().eq('user_id', userId).eq('course_id', courseId);
  } catch (err) {
    console.error('unfollowCourse error:', err);
  }
}

export async function fetchFollowedCourseIds(): Promise<string[]> {
  const userId = getUserId();
  if (!userId) return [];

  try {
    const supabase = getSupabase();
    const { data } = await supabase.from('course_followers').select('course_id').eq('user_id', userId);
    return (data || []).map((d: any) => d.course_id);
  } catch (err) {
    console.error('fetchFollowedCourseIds error:', err);
    return [];
  }
}

export async function rateCourse(courseId: string, rating: number, reviewText?: string): Promise<void> {
  const userId = getUserId();
  if (!userId) return;

  try {
    const supabase = getSupabase();
    await supabase
      .from('course_ratings')
      .upsert({
        user_id: userId,
        course_id: courseId,
        rating,
        review_text: reviewText || '',
      }, { onConflict: 'user_id,course_id' });
  } catch (err) {
    console.error('rateCourse error:', err);
  }
}

// ============================================================================
// USER STATS / XP
// ============================================================================

export async function grantXP(amount: number): Promise<void> {
  const userId = getUserId();
  if (!userId) return;

  try {
    const supabase = getSupabase();
    // Get current stats
    const { data: existing } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) {
      const newXP = (existing.xp || 0) + amount;
      await supabase
        .from('user_stats')
        .update({
          xp: newXP,
          level: Math.floor(newXP / 200) + 1,
          last_active_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } else {
      await supabase.from('user_stats').insert({
        user_id: userId,
        xp: amount,
        level: 1,
        last_active_date: new Date().toISOString().split('T')[0],
      });
    }
  } catch (err) {
    console.error('grantXP error:', err);
  }
}

// ============================================================================
// DB → App Type Converters
// ============================================================================

function dbCourseToApp(
  c: any,
  allVideos: any[],
  allModules: any[],
  progressMap: Record<string, { is_completed: boolean; completed_at: string | null }>
): Course {
  const courseVideos = allVideos
    .filter((v: any) => v.course_id === c.id)
    .map((v: any) => ({
      id: v.id,
      youtubeId: v.youtube_id,
      title: v.title,
      duration: v.duration || 0,
      durationFormatted: v.duration_formatted || '0:00',
      thumbnailUrl: v.thumbnail_url || '',
      channelName: v.channel_name || '',
      description: v.description || '',
      isCompleted: progressMap[v.id]?.is_completed || false,
      completedAt: progressMap[v.id]?.completed_at || undefined,
      order: v.order,
      moduleId: v.module_id || undefined,
    }));

  const courseModules = allModules
    .filter((m: any) => m.course_id === c.id)
    .map((m: any) => ({
      id: m.id,
      title: m.title,
      description: m.description || '',
      order: m.order,
    }));

  return {
    id: c.id,
    title: c.title,
    description: c.description || '',
    thumbnailUrl: c.thumbnail_url || '',
    channelName: c.channel_name || '',
    category: c.category || 'Development',
    tags: c.tags || [],
    videos: courseVideos,
    modules: courseModules,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    lastOpenedAt: c.last_opened_at || c.updated_at,
    targetDays: c.target_days,
    isFavorite: c.is_favorite || false,
    isArchived: c.is_archived || false,
    isPublic: c.is_public || false,
    authorId: c.author_id,
  };
}
