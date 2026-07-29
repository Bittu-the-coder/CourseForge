import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  Volume1,
  VolumeX, 
  Maximize,
  Minimize,
  SkipForward, 
  SkipBack, 
  CheckCircle2,
  Settings,
  MonitorPlay,
} from 'lucide-react';
import type { Video } from '../types';

interface CustomVideoPlayerProps {
  video: Video;
  onVideoEnded: () => void;
  onToggleComplete: () => void;
  onTimeUpdate?: (time: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface CustomVideoPlayerHandle {
  getCurrentTime: () => number;
  seekTo: (seconds: number) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const QUALITY_LABELS: Record<string, string> = {
  hd2160: '4K',
  hd1440: '1440p',
  hd1080: '1080p',
  hd720: '720p',
  large: '480p',
  medium: '360p',
  small: '240p',
  tiny: '144p',
  auto: 'Auto',
};

const getSavedPlaybackRate = (): number => {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('courseforge_playback_rate');
    if (saved) {
      const num = parseFloat(saved);
      if (!isNaN(num) && SPEEDS.includes(num)) return num;
    }
  }
  return 1;
};

export const CustomVideoPlayer = forwardRef<CustomVideoPlayerHandle, CustomVideoPlayerProps>(({
  video,
  onVideoEnded,
  onToggleComplete,
  onTimeUpdate,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration || 0);
  const [buffered, setBuffered] = useState(0);
  const [isApiReady, setIsApiReady] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(getSavedPlaybackRate());
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerElementId = `yt-player-${video.id}`;

  useImperativeHandle(ref, () => ({
    getCurrentTime: () => currentTime,
    seekTo: (seconds: number) => handleSeek(seconds),
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

  // Initialize YouTube Player
  useEffect(() => {
    if (!isApiReady) return;
    if (playerRef.current && typeof playerRef.current.destroy === 'function') {
      try { playerRef.current.destroy(); } catch { /* */ }
    }

    const initialSpeed = getSavedPlaybackRate();

    playerRef.current = new window.YT.Player(playerElementId, {
      videoId: video.youtubeId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        rel: 0,
        modestbranding: 1,
        showinfo: 0,
        iv_load_policy: 3,
        disablekb: 1,
        fs: 0,
        playsinline: 1,
        enablejsapi: 1,
        cc_load_policy: 0,
        origin: typeof window !== 'undefined' ? window.location.origin : '',
      },
      events: {
        onReady: (event: any) => {
          const dur = event.target.getDuration();
          setDuration(dur || video.duration);
          event.target.playVideo();
          setIsPlaying(true);

          // Apply global playback speed preference automatically across all videos
          if (typeof event.target.setPlaybackRate === 'function') {
            event.target.setPlaybackRate(initialSpeed);
            setPlaybackRate(initialSpeed);
          }

          // Get available quality levels
          try {
            const levels = event.target.getAvailableQualityLevels();
            if (levels && levels.length > 0) {
              setAvailableQualities(levels);
              setCurrentQuality(event.target.getPlaybackQuality() || 'auto');
            }
          } catch { /* */ }
        },
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            // Ensure global speed preference is maintained when video starts playing
            const currentSpeed = getSavedPlaybackRate();
            if (typeof event.target.setPlaybackRate === 'function') {
              event.target.setPlaybackRate(currentSpeed);
              setPlaybackRate(currentSpeed);
            }
            try {
              const levels = event.target.getAvailableQualityLevels();
              if (levels && levels.length > 0) setAvailableQualities(levels);
            } catch { /* */ }
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false);
          } else if (event.data === window.YT.PlayerState.ENDED) {
            setIsPlaying(false);
            onVideoEnded();
          }
        },
        onPlaybackQualityChange: (event: any) => {
          setCurrentQuality(event.data || 'auto');
        },
      },
    });

    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try { playerRef.current.destroy(); } catch { /* */ }
      }
    };
  }, [video.youtubeId, isApiReady]);

  // Track progress every 250ms
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const curr = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          const loaded = playerRef.current.getVideoLoadedFraction();
          if (curr !== undefined) setCurrentTime(curr);
          if (dur) setDuration(dur);
          if (loaded) setBuffered(loaded * 100);
          if (onTimeUpdate) onTimeUpdate(curr);
        } catch { /* */ }
      }
    }, 250);
    return () => clearInterval(interval);
  }, [onTimeUpdate]);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    resetControlsTimer();
    return () => { if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current); };
  }, [isPlaying]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          handleFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          handleMuteToggle();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSeek(Math.max(0, currentTime - 5));
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSeek(Math.min(duration, currentTime + 5));
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(Math.min(100, volume + 5));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 5));
          break;
        case 'j':
        case 'J':
          e.preventDefault();
          handleSeek(Math.max(0, currentTime - 10));
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          handleSeek(Math.min(duration, currentTime + 10));
          break;
        case 'Escape':
          if (isFullscreen) document.exitFullscreen();
          setShowSpeedMenu(false);
          setShowQualityMenu(false);
          break;
        case ',':
          if (e.shiftKey) {
            e.preventDefault();
            const idx = SPEEDS.indexOf(playbackRate);
            if (idx > 0) handleSpeedChange(SPEEDS[idx - 1]);
          }
          break;
        case '.':
          if (e.shiftKey) {
            e.preventDefault();
            const idx = SPEEDS.indexOf(playbackRate);
            if (idx < SPEEDS.length - 1) handleSpeedChange(SPEEDS[idx + 1]);
          }
          break;
        case '0':
        case 'Home':
          e.preventDefault();
          handleSeek(0);
          break;
        case 'End':
          e.preventDefault();
          handleSeek(duration);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, duration, isPlaying, isMuted, volume, isFullscreen, playbackRate]);

  const handlePlayPause = () => {
    if (!playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  };

  const handleMuteToggle = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume);
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (val: number) => {
    if (!playerRef.current) return;
    setVolume(val);
    playerRef.current.setVolume(val);
    if (val === 0) { playerRef.current.mute(); setIsMuted(true); }
    else if (isMuted) { playerRef.current.unMute(); setIsMuted(false); }
  };

  const handleSeek = (seconds: number) => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(seconds, true);
      setCurrentTime(seconds);
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
      playerRef.current.setPlaybackRate(speed);
      setPlaybackRate(speed);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('courseforge_playback_rate', speed.toString());
      }
    }
    setShowSpeedMenu(false);
    setShowQualityMenu(false);
  };

  const handleQualityChange = (quality: string) => {
    if (playerRef.current) {
      try {
        if (typeof playerRef.current.setPlaybackQualityRange === 'function') {
          playerRef.current.setPlaybackQualityRange(quality, quality);
        }
        if (typeof playerRef.current.setPlaybackQuality === 'function') {
          playerRef.current.setPlaybackQuality(quality);
        }
        setCurrentQuality(quality);
      } catch { /* */ }
    }
    setShowQualityMenu(false);
    setShowSpeedMenu(false);
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) document.exitFullscreen();
      else containerRef.current.requestFullscreen();
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    handleSeek(fraction * duration);
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(fraction * duration);
    setHoverX(e.clientX - rect.left);
  };

  const formatSeconds = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl overflow-hidden bg-black select-none group/player"
      onMouseMove={resetControlsTimer}
      onMouseLeave={() => { if (isPlaying) setShowControls(false); }}
      onClick={(e) => {
        if (showSpeedMenu && !(e.target as HTMLElement).closest('.speed-menu')) setShowSpeedMenu(false);
        if (showQualityMenu && !(e.target as HTMLElement).closest('.quality-menu')) setShowQualityMenu(false);
      }}
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      {/* YouTube Player */}
      <div className="relative w-full aspect-video bg-black overflow-hidden">
        <div id={playerElementId} className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }} />

        {/* Full overlay */}
        <div
          className="absolute inset-0 z-10 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); handlePlayPause(); resetControlsTimer(); }}
          onDoubleClick={(e) => { e.stopPropagation(); handleFullscreen(); }}
        />

        {/* Top cover strip to hide YouTube title/channel overlay */}
        <div className={`absolute top-0 left-0 right-0 h-16 z-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`} />

        {/* Center play icon when paused */}
        {!isPlaying && showControls && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center animate-in zoom-in duration-200">
              <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white ml-1" />
            </div>
          </div>
        )}

        {/* Bottom Controls */}
        <div className={`absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

          <div className="relative px-3 pb-2.5 pt-10">
            {/* Progress Bar */}
            <div
              ref={progressRef}
              className="group/progress w-full h-1 hover:h-2 bg-white/20 rounded-full cursor-pointer mb-2.5 relative transition-all"
              onClick={(e) => { e.stopPropagation(); handleProgressClick(e); }}
              onMouseMove={handleProgressHover}
              onMouseLeave={() => setHoverTime(null)}
            >
              <div className="absolute left-0 top-0 h-full bg-white/25 rounded-full pointer-events-none" style={{ width: `${buffered}%` }} />
              <div className="absolute left-0 top-0 h-full bg-brand-orange rounded-full pointer-events-none" style={{ width: `${progress}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-brand-orange rounded-full shadow-lg border-2 border-white opacity-0 group-hover/progress:opacity-100 transition-opacity pointer-events-none" style={{ left: `calc(${progress}% - 7px)` }} />
              {hoverTime !== null && (
                <div className="absolute -top-8 bg-black/95 text-white text-[10px] font-mono px-2 py-0.5 rounded pointer-events-none whitespace-nowrap" style={{ left: `${hoverX}px`, transform: 'translateX(-50%)' }}>
                  {formatSeconds(hoverTime)}
                </div>
              )}
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between gap-1.5">
              {/* Left controls */}
              <div className="flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); handlePlayPause(); }} className="p-1.5 rounded-md text-white hover:bg-white/10 transition-colors" title={isPlaying ? 'Pause (K)' : 'Play (K)'}>
                  {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); onPrevious(); }} disabled={!hasPrevious} className="p-1.5 rounded-md text-white hover:bg-white/10 disabled:opacity-30 transition-colors" title="Previous">
                  <SkipBack className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onNext(); }} disabled={!hasNext} className="p-1.5 rounded-md text-white hover:bg-white/10 disabled:opacity-30 transition-colors" title="Next">
                  <SkipForward className="w-4 h-4" />
                </button>

                {/* Volume */}
                <div className="flex items-center gap-0.5 group/vol">
                  <button onClick={(e) => { e.stopPropagation(); handleMuteToggle(); }} className="p-1.5 rounded-md text-white hover:bg-white/10 transition-colors" title="Mute (M)">
                    <VolumeIcon className="w-4 h-4" />
                  </button>
                  <input type="range" min={0} max={100} value={isMuted ? 0 : volume} onChange={(e) => { e.stopPropagation(); handleVolumeChange(Number(e.target.value)); }} className="w-0 group-hover/vol:w-16 transition-all duration-200 accent-white h-1 cursor-pointer opacity-0 group-hover/vol:opacity-100" onClick={(e) => e.stopPropagation()} />
                </div>

                <span className="text-white/80 text-[11px] font-mono ml-1 select-none">
                  {formatSeconds(currentTime)} / {formatSeconds(duration)}
                </span>
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-1">
                {/* Speed */}
                <div className="relative speed-menu">
                  <button onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); setShowQualityMenu(false); }} className="px-2 py-1 rounded-md text-white hover:bg-white/10 text-[11px] font-semibold transition-colors" title="Playback Speed">
                    {playbackRate === 1 ? '1x' : `${playbackRate}x`}
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-xl rounded-lg border border-white/10 py-1.5 min-w-[100px] z-50 shadow-xl" onClick={(e) => e.stopPropagation()}>
                      <div className="px-3 py-1 text-[10px] font-semibold text-white/40 uppercase tracking-wider">Speed</div>
                      {SPEEDS.map((speed) => (
                        <button key={speed} onClick={(e) => { e.stopPropagation(); handleSpeedChange(speed); }} className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${speed === playbackRate ? 'text-brand-orange font-bold bg-white/5' : 'text-white hover:bg-white/10'}`}>
                          {speed === 1 ? 'Normal' : `${speed}x`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quality */}
                {availableQualities.length > 0 && (
                  <div className="relative quality-menu">
                    <button onClick={(e) => { e.stopPropagation(); setShowQualityMenu(!showQualityMenu); setShowSpeedMenu(false); }} className="px-2 py-1 rounded-md text-white hover:bg-white/10 text-[11px] font-semibold transition-colors" title="Quality">
                      <MonitorPlay className="w-4 h-4 inline-block mr-0.5" />
                      {QUALITY_LABELS[currentQuality] || currentQuality}
                    </button>
                    {showQualityMenu && (
                      <div className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-xl rounded-lg border border-white/10 py-1.5 min-w-[110px] z-50 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="px-3 py-1 text-[10px] font-semibold text-white/40 uppercase tracking-wider">Quality</div>
                        {availableQualities.map((q) => (
                          <button key={q} onClick={(e) => { e.stopPropagation(); handleQualityChange(q); }} className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${q === currentQuality ? 'text-brand-orange font-bold bg-white/5' : 'text-white hover:bg-white/10'}`}>
                            {QUALITY_LABELS[q] || q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Complete */}
                <button onClick={(e) => { e.stopPropagation(); onToggleComplete(); }} className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${video.isCompleted ? 'bg-emerald-600 text-white' : 'bg-brand-orange text-white hover:bg-brand-orange-active'}`} title="Mark Complete">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {video.isCompleted ? '✓' : 'Done'}
                </button>

                {/* Fullscreen */}
                <button onClick={(e) => { e.stopPropagation(); handleFullscreen(); }} className="p-1.5 rounded-md text-white hover:bg-white/10 transition-colors" title="Fullscreen (F)">
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info bar below */}
      <div className="px-3 py-2.5 bg-canvas-card border-t border-hairline text-ink flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm text-ink line-clamp-1">{video.title}</h3>
          <p className="text-xs text-ink-muted mt-0.5">{video.channelName}</p>
        </div>
        <span className="text-[9px] text-ink-muted font-mono flex-shrink-0 hidden md:block">
          K Play · F Full · M Mute · ←→ ±5s · {'<>'} Speed
        </span>
      </div>
    </div>
  );
});

CustomVideoPlayer.displayName = 'CustomVideoPlayer';
