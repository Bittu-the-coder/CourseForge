import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { 
  CheckCircle2, 
  SkipForward, 
  SkipBack 
} from 'lucide-react';
import type { Video } from '../types';

interface YouTubePlayerProps {
  video: Video;
  courseId?: string;
  onVideoEnded: () => void;
  onToggleComplete: () => void;
  onTimeUpdate?: (time: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface YouTubePlayerHandle {
  getCurrentTime: () => number;
  seekTo: (seconds: number) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(({
  video,
  courseId,
  onVideoEnded,
  onToggleComplete,
  onTimeUpdate,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
}, ref) => {
  const playerRef = useRef<any>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isApiReady, setIsApiReady] = useState(false);
  const playerElementId = `yt-player-${video.id}`;

  const getSavedPosition = (): number => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(`courseforge_pos_${video.id}`);
      if (saved) {
        const num = parseFloat(saved);
        if (!isNaN(num) && num > 3 && num < (video.duration || 3600) - 5) {
          return num;
        }
      }
    }
    return 0;
  };

  useImperativeHandle(ref, () => ({
    getCurrentTime: () => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const t = playerRef.current.getCurrentTime();
          if (t !== undefined) return t;
        } catch { /* */ }
      }
      return currentTime;
    },
    seekTo: (seconds: number) => {
      if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        try {
          playerRef.current.seekTo(seconds, true);
          setCurrentTime(seconds);
        } catch { /* */ }
      }
    },
  }));

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsApiReady(true);
      return;
    }
    const existingScript = document.getElementById('yt-api-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'yt-api-script';
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    }
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousReady) previousReady();
      setIsApiReady(true);
    };
  }, []);

  // Initialize YouTube Player with native YouTube controls enabled
  useEffect(() => {
    if (!isApiReady) return;

    if (playerRef.current && typeof playerRef.current.destroy === 'function') {
      try { playerRef.current.destroy(); } catch { /* */ }
    }

    const startPos = getSavedPosition();

    playerRef.current = new window.YT.Player(playerElementId, {
      videoId: video.youtubeId,
      playerVars: {
        autoplay: 1,
        controls: 1,           // Native YouTube controls enabled
        rel: 0,
        modestbranding: 1,
        enablejsapi: 1,
        start: Math.floor(startPos), // Start playback from last saved timestamp!
        origin: typeof window !== 'undefined' ? window.location.origin : '',
      },
      events: {
        onReady: (event: any) => {
          try {
            event.target.playVideo();
            if (startPos > 0 && typeof event.target.seekTo === 'function') {
              event.target.seekTo(startPos, true);
            }
          } catch { /* */ }
        },
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.ENDED) {
            // Auto-complete & auto-advance when YouTube video ends!
            onVideoEnded();
          }
        },
      },
    });

    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try { playerRef.current.destroy(); } catch { /* */ }
      }
    };
  }, [video.youtubeId, isApiReady]);

  // Track progress every 500ms & save last watched position
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const curr = playerRef.current.getCurrentTime();
          if (curr !== undefined) {
            setCurrentTime(curr);
            if (onTimeUpdate) onTimeUpdate(curr);

            // Save last watched position per video
            if (curr > 3 && typeof localStorage !== 'undefined') {
              localStorage.setItem(`courseforge_pos_${video.id}`, curr.toString());
              localStorage.setItem(`courseforge_last_vid_${courseId || 'default'}`, video.id);
            }
          }
        } catch { /* */ }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [video.id, courseId, onTimeUpdate]);

  return (
    <div className="card-hairline overflow-hidden bg-black text-white rounded-xl space-y-0">
      {/* Native YouTube Player Container */}
      <div className="relative w-full aspect-video bg-black overflow-hidden">
        <div id={playerElementId} className="w-full h-full" />
      </div>

      {/* Workspace Control Bar */}
      <div className="p-3 bg-canvas-card border-t border-hairline text-ink flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm text-ink line-clamp-1">{video.title}</h3>
          <p className="text-xs text-ink-muted mt-0.5">{video.channelName} • {video.durationFormatted}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="p-2 rounded-md border border-hairline bg-canvas-soft text-ink disabled:opacity-30 hover:bg-canvas-strong transition-colors"
            title="Previous Lesson"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={onNext}
            disabled={!hasNext}
            className="p-2 rounded-md border border-hairline bg-canvas-soft text-ink disabled:opacity-30 hover:bg-canvas-strong transition-colors"
            title="Next Lesson"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleComplete}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-colors ${
              video.isCompleted
                ? 'bg-emerald-600 text-white'
                : 'bg-brand-orange text-white hover:bg-brand-orange-active'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {video.isCompleted ? 'Completed ✓' : 'Complete & Next'}
          </button>
        </div>
      </div>
    </div>
  );
});

YouTubePlayer.displayName = 'YouTubePlayer';
