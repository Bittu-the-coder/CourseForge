import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Link as LinkIcon, 
  CheckCircle2, 
  Layers,
  Tag,
  Clock,
  BookOpen,
  Loader2,
  GripVertical,
  ListVideo
} from 'lucide-react';

const Youtube: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" fill="currentColor" />
  </svg>
);
import type { Course, Video } from '../types';
import { fetchYouTubeVideoInfo, extractYouTubeId, extractPlaylistId, fetchPlaylistVideos, getYouTubeThumbnail } from '../services/youtube';

interface CourseBuilderProps {
  onSaveCourse: (course: Course) => void;
  onNavigate: (tab: string) => void;
}

export const CourseBuilder: React.FC<CourseBuilderProps> = ({ onSaveCourse, onNavigate }) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Web Development');
  const [tagsInput, setTagsInput] = useState('');
  const [targetDays, setTargetDays] = useState(30);
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  const [videos, setVideos] = useState<Video[]>([]);

  // Detect if URL is a playlist or single video
  const isPlaylistUrl = !!extractPlaylistId(youtubeUrl);
  const isSingleVideoUrl = !!extractYouTubeId(youtubeUrl);

  // Import playlist — fetches ALL videos as flat list
  const handleImportPlaylist = async () => {
    if (!youtubeUrl.trim()) return;
    setIsLoading(true);
    setErrorMessage('');
    setLoadingMessage('Fetching playlist videos...');

    try {
      const fetchedVideos = await fetchPlaylistVideos(youtubeUrl);
      
      // Reorder to continue from existing videos
      const startOrder = videos.length;
      const numberedVideos = fetchedVideos.map((v, i) => ({
        ...v,
        order: startOrder + i + 1,
      }));

      setVideos((prev) => [...prev, ...numberedVideos]);

      // Auto-fill course metadata from first video
      if (!title && fetchedVideos.length > 0) {
        setTitle(fetchedVideos[0].channelName + ' Course');
      }
      if (!thumbnailUrl && fetchedVideos.length > 0) {
        setThumbnailUrl(fetchedVideos[0].thumbnailUrl);
      }

      setLoadingMessage(`✓ Imported ${fetchedVideos.length} videos`);
      setYoutubeUrl('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to import playlist.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add single video
  const handleAddSingleVideo = async () => {
    if (!youtubeUrl.trim()) return;
    setIsLoading(true);
    setErrorMessage('');
    setLoadingMessage('Fetching video info...');

    try {
      const info = await fetchYouTubeVideoInfo(youtubeUrl);

      const newVid: Video = {
        id: `v-${Date.now()}`,
        youtubeId: info.youtubeId,
        title: info.title,
        duration: info.duration,
        durationFormatted: `${Math.floor(info.duration / 60)}:${String(info.duration % 60).padStart(2, '0')}`,
        thumbnailUrl: info.thumbnailUrl,
        channelName: info.channelName,
        description: `Video lesson from ${info.channelName}`,
        isCompleted: false,
        order: videos.length + 1,
      };

      setVideos((prev) => [...prev, newVid]);

      if (!title) setTitle(info.title);
      if (!thumbnailUrl) setThumbnailUrl(info.thumbnailUrl);
      setYoutubeUrl('');
      setLoadingMessage('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch video info.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle import based on URL type
  const handleImport = () => {
    if (isPlaylistUrl) {
      handleImportPlaylist();
    } else if (isSingleVideoUrl) {
      handleAddSingleVideo();
    }
  };

  // Remove a video
  const handleRemoveVideo = (videoId: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== videoId).map((v, i) => ({ ...v, order: i + 1 })));
  };

  // Save Final Course
  const handleSubmitCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || videos.length === 0) return;

    const tagsArr = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);

    const newCourse: Course = {
      id: `course-${Date.now()}`,
      title,
      description: description || `Course with ${videos.length} video lessons.`,
      thumbnailUrl: thumbnailUrl || videos[0]?.thumbnailUrl || '',
      channelName: videos[0]?.channelName || 'Multi-Creator',
      category,
      tags: tagsArr.length > 0 ? tagsArr : ['Self-Paced'],
      videos,
      modules: [], // User creates modules later via drag-and-drop
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastOpenedAt: new Date().toISOString(),
      targetDays,
      isFavorite: false,
    };

    onSaveCourse(newCourse);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8 animate-in fade-in">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-hairline pb-4">
        <div>
          <h1 className="text-2xl font-normal text-ink flex items-center gap-2.5">
            <img src="/logo.png" alt="" className="w-6 h-6 object-contain rounded-sm" /> Course Builder
          </h1>
          <p className="text-xs text-ink-muted">
            Paste a YouTube playlist URL to import all videos, or add individual video links one by one.
          </p>
        </div>
      </div>

      {/* YouTube URL Input */}
      <div className="card-hairline p-6 space-y-4">
        <h2 className="text-xs font-semibold uppercase font-mono tracking-wider text-ink flex items-center gap-2">
          <Youtube className="w-4 h-4 text-red-500" /> Import Videos from YouTube
        </h2>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => { setYoutubeUrl(e.target.value); setErrorMessage(''); }}
              onKeyDown={(e) => e.key === 'Enter' && (isPlaylistUrl ? handleImportPlaylist() : handleAddSingleVideo())}
              placeholder="Paste YouTube video or playlist URL..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-canvas border border-hairline rounded-md focus:outline-none focus:border-brand-orange font-mono text-ink"
            />
          </div>

          <div className="flex gap-2">
            {isSingleVideoUrl && (
              <button
                type="button"
                onClick={handleAddSingleVideo}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-md bg-brand-orange text-white text-xs font-semibold hover:bg-brand-orange-active transition-colors disabled:opacity-40 flex items-center gap-1.5"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add Video
              </button>
            )}

            {isPlaylistUrl && (
              <button
                type="button"
                onClick={handleImportPlaylist}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-md bg-brand-orange/90 hover:bg-brand-orange text-white text-xs font-semibold transition-colors disabled:opacity-40 flex items-center gap-1.5"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ListVideo className="w-3.5 h-3.5" />} Import Playlist
              </button>
            )}

            {!isSingleVideoUrl && !isPlaylistUrl && (
              <button
                type="button"
                disabled
                className="px-4 py-2.5 rounded-md bg-brand-orange text-white text-xs font-semibold opacity-40 flex items-center gap-1.5 cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" /> Add Video
              </button>
            )}
          </div>
        </div>

        {/* Status messages */}
        {loadingMessage && !errorMessage && (
          <p className="text-xs text-emerald-600 font-mono">{loadingMessage}</p>
        )}
        {errorMessage && (
          <p className="text-xs text-red-500 font-mono">{errorMessage}</p>
        )}

        {isPlaylistUrl && (
          <p className="text-xs text-brand-orange font-mono">
            🎬 Playlist detected — all videos will be imported as flat lessons (no auto-modules).
          </p>
        )}
      </div>

      {/* Imported Videos List */}
      {videos.length > 0 && (
        <div className="card-hairline p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase font-mono tracking-wider text-ink flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-orange" /> Imported Videos ({videos.length})
            </h2>
            <span className="text-xs font-mono text-ink-muted">
              Total: {Math.round(videos.reduce((a, v) => a + v.duration, 0) / 60)} min
            </span>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {videos.map((vid, idx) => (
              <div
                key={vid.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-hairline hover:border-hairline-strong bg-canvas-soft transition-colors group"
              >
                <span className="text-xs font-mono text-ink-muted w-6 text-center flex-shrink-0">
                  {idx + 1}
                </span>
                <img
                  src={vid.thumbnailUrl}
                  alt={vid.title}
                  className="w-20 h-12 rounded object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{vid.title}</p>
                  <p className="text-xs text-ink-muted font-mono">
                    {vid.channelName} • {vid.durationFormatted}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveVideo(vid.id)}
                  className="p-1.5 rounded text-ink-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove video"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Metadata Form */}
      {videos.length > 0 && (
        <form onSubmit={handleSubmitCourse} className="card-hairline p-6 space-y-5">
          <h2 className="text-xs font-semibold uppercase font-mono tracking-wider text-ink flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-orange" /> Course Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink">Course Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Full-Stack Web Development Mastery"
                className="w-full px-3 py-2 text-sm bg-canvas border border-hairline rounded-md focus:outline-none focus:border-brand-orange text-ink"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-canvas border border-hairline rounded-md focus:outline-none focus:border-brand-orange text-ink"
              >
                {['Web Development', 'Mobile Dev', 'Data Science', 'Machine Learning', 'Computer Science', 'DevOps', 'Design', 'Other'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-ink">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of what this course covers..."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-canvas border border-hairline rounded-md focus:outline-none focus:border-brand-orange text-ink resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink flex items-center gap-1">
                <Tag className="w-3 h-3" /> Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="React, JavaScript, Node.js"
                className="w-full px-3 py-2 text-sm bg-canvas border border-hairline rounded-md focus:outline-none focus:border-brand-orange text-ink"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink flex items-center gap-1">
                <Clock className="w-3 h-3" /> Target Days
              </label>
              <select
                value={targetDays}
                onChange={(e) => setTargetDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-canvas border border-hairline rounded-md focus:outline-none focus:border-brand-orange text-ink"
              >
                <option value={30}>30 Days (Intense)</option>
                <option value={60}>60 Days (Balanced)</option>
                <option value={90}>90 Days (Relaxed)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-hairline">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-md bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange-active transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Create Course ({videos.length} videos)
            </button>
            <span className="text-xs text-ink-muted font-mono">
              You can organize videos into modules later using drag-and-drop.
            </span>
          </div>
        </form>
      )}

    </div>
  );
};
