import type { Course, Video } from '../types';

const YOUTUBE_API_KEY = (typeof import.meta !== 'undefined' && (import.meta as any).env?.PUBLIC_YOUTUBE_API_KEY) || '';

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : (url.length === 11 ? url : null);
}

export function extractPlaylistId(url: string): string | null {
  if (!url) return null;
  const regExp = /[&?]list=([^&]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

export function getYouTubeThumbnail(youtubeId: string): string {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/** Convert ISO 8601 duration (PT1H2M3S) to seconds */
function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] || '0', 10);
  const m = parseInt(match[2] || '0', 10);
  const s = parseInt(match[3] || '0', 10);
  return h * 3600 + m * 60 + s;
}

export async function fetchYouTubeVideoInfo(urlOrId: string): Promise<{
  title: string;
  channelName: string;
  thumbnailUrl: string;
  youtubeId: string;
  duration: number;
}> {
  const youtubeId = extractYouTubeId(urlOrId) || urlOrId;
  const defaultThumbnail = getYouTubeThumbnail(youtubeId);

  // Try YouTube Data API first if key is available
  if (YOUTUBE_API_KEY && YOUTUBE_API_KEY !== 'your-youtube--key-here') {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${youtubeId}&key=${YOUTUBE_API_KEY}`
      );
      if (res.ok) {
        const data = await res.json();
        const item = data.items?.[0];
        if (item) {
          return {
            title: item.snippet.title,
            channelName: item.snippet.channelTitle || 'YouTube Channel',
            thumbnailUrl: item.snippet.thumbnails?.high?.url || defaultThumbnail,
            youtubeId,
            duration: parseDuration(item.contentDetails?.duration || 'PT0S'),
          };
        }
      }
    } catch (err) {
      console.warn('YouTube Data API fetch failed, falling back to noembed:', err);
    }
  }

  // Fallback to noembed
  try {
    const oembedUrl = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${youtubeId}`;
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && data.title) {
        return {
          title: data.title,
          channelName: data.author_name || 'YouTube Channel',
          thumbnailUrl: data.thumbnail_url || defaultThumbnail,
          youtubeId,
          duration: 900, // default 15m — noembed doesn't provide duration
        };
      }
    }
  } catch (err) {
    console.warn('oEmbed fetch failed, using fallback:', err);
  }

  return {
    title: `YouTube Lesson: ${youtubeId}`,
    channelName: 'YouTube Creator',
    thumbnailUrl: defaultThumbnail,
    youtubeId,
    duration: 600,
  };
}

/**
 * Fetch ALL videos from a YouTube playlist using the Data API v3.
 * Returns a flat Video[] array — lesson name = video title, order = playlist position.
 * Handles pagination (nextPageToken) to get every video.
 */
export async function fetchPlaylistVideos(playlistUrl: string): Promise<Video[]> {
  const playlistId = extractPlaylistId(playlistUrl);
  if (!playlistId) {
    throw new Error('Invalid playlist URL — could not extract playlist ID.');
  }

  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'your-youtube--key-here') {
    throw new Error(
      'YouTube Data API key is required to import playlists. Add your API key to PUBLIC_YOUTUBE_API_KEY in .env'
    );
  }

  const videos: Video[] = [];
  let nextPageToken: string | undefined = undefined;

  // Step 1: Fetch all playlistItems with pagination
  do {
    const params = new URLSearchParams({
      part: 'snippet,contentDetails',
      playlistId,
      maxResults: '50',
      key: YOUTUBE_API_KEY,
    });
    if (nextPageToken) params.set('pageToken', nextPageToken);

    const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params}`);
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`YouTube API error (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    nextPageToken = data.nextPageToken;

    for (const item of data.items || []) {
      const snippet = item.snippet;
      const videoId = snippet.resourceId?.videoId || item.contentDetails?.videoId;
      if (!videoId) continue;

      // Skip deleted/private videos
      if (snippet.title === 'Deleted video' || snippet.title === 'Private video') continue;

      videos.push({
        id: `v-${Date.now()}-${videos.length}`,
        youtubeId: videoId,
        title: snippet.title,
        duration: 0, // will be filled in batch below
        durationFormatted: '0:00',
        thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || getYouTubeThumbnail(videoId),
        channelName: snippet.videoOwnerChannelTitle || snippet.channelTitle || 'YouTube',
        description: (snippet.description || '').slice(0, 200),
        isCompleted: false,
        order: snippet.position ?? videos.length,
      });
    }
  } while (nextPageToken);

  // Step 2: Batch fetch durations from videos.list (max 50 IDs per request)
  const videoIds = videos.map((v) => v.youtubeId);
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    try {
      const params = new URLSearchParams({
        part: 'contentDetails',
        id: batch.join(','),
        key: YOUTUBE_API_KEY,
      });
      const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`);
      if (res.ok) {
        const data = await res.json();
        for (const item of data.items || []) {
          const vid = videos.find((v) => v.youtubeId === item.id);
          if (vid && item.contentDetails?.duration) {
            vid.duration = parseDuration(item.contentDetails.duration);
            vid.durationFormatted = formatDuration(vid.duration);
          }
        }
      }
    } catch (err) {
      console.warn('Duration batch fetch failed for chunk starting at', i, err);
    }
  }

  return videos;
}

/**
 * Create a Course object from a YouTube playlist URL.
 * Fetches all videos, returns flat structure with no auto-modules.
 */
export async function createCourseFromPlaylist(playlistUrl: string): Promise<Partial<Course>> {
  const videos = await fetchPlaylistVideos(playlistUrl);

  // Use first video's channel as the course channel
  const channelName = videos[0]?.channelName || 'YouTube Creator';
  const thumbnailUrl = videos[0]?.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80';

  return {
    title: '', // User will set this
    description: `Course imported from YouTube playlist with ${videos.length} lessons.`,
    thumbnailUrl,
    channelName,
    category: 'Development',
    tags: ['YouTube', 'Playlist', 'Self-Paced'],
    videos,
    modules: [], // No auto-modules — user creates them later
  };
}
