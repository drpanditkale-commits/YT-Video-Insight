import React, { useState, useMemo, useRef, useEffect } from 'react';
import { VideoMetadata } from '../types';

interface VideoDetailsProps {
  data: VideoMetadata;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

const VideoDetails: React.FC<VideoDetailsProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'summary' | 'subtitles' | 'description'>('all');
  const [summaryCopied, setSummaryCopied] = useState(false);
  const [descCopied, setDescCopied] = useState(false);
  const [subtitlesCopied, setSubtitlesCopied] = useState(false);
  const [titleCopied, setTitleCopied] = useState(false);
  const [allCopied, setAllCopied] = useState(false);

  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  const videoId = useMemo(() => {
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = data.videoUrl.match(regExp);
    return match && match[1] ? match[1] : null;
  }, [data.videoUrl]);

  // Load YouTube IFrame Player API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (window.YT && window.YT.Player && videoId) {
        playerRef.current = new window.YT.Player('youtube-player', {
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            disablekb: 0,
            enablejsapi: 1,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
          },
          events: {
            onReady: (event: any) => {
              setPlayer(event.target);
              try {
                setDuration(event.target.getDuration());
                setVolume(event.target.getVolume());
              } catch (e) {
                console.error(e);
              }
            },
            onStateChange: (event: any) => {
              setIsPlaying(event.data === 1);
            },
          },
        });
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [videoId]);

  useEffect(() => {
    let interval: number;
    if (isPlaying && player) {
      interval = window.setInterval(() => {
        try {
          if (player.getCurrentTime) {
            setCurrentTime(player.getCurrentTime());
          }
        } catch (e) {
          // ignore
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, player]);

  const togglePlay = () => {
    if (!player) return;
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setVolume(val);
    player?.setVolume(val);
  };

  const handleSeekProgress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    player?.seekTo(val, true);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Copy to Clipboard handler specifically for the Summary text
  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(data.summary);
      setSummaryCopied(true);
      setTimeout(() => setSummaryCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy summary to clipboard: ', err);
    }
  };

  const handleCopyDescription = async () => {
    try {
      await navigator.clipboard.writeText(data.description);
      setDescCopied(true);
      setTimeout(() => setDescCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy description: ', err);
    }
  };

  const handleCopySubtitles = async () => {
    try {
      await navigator.clipboard.writeText(data.subtitles);
      setSubtitlesCopied(true);
      setTimeout(() => setSubtitlesCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy subtitles: ', err);
    }
  };

  const handleCopyTitle = async () => {
    try {
      await navigator.clipboard.writeText(data.title);
      setTitleCopied(true);
      setTimeout(() => setTitleCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy title: ', err);
    }
  };

  const handleCopyAll = async () => {
    try {
      const fullText = `TITLE: ${data.title}\n${data.channel ? `CHANNEL: ${data.channel}\n` : ''}URL: ${data.videoUrl}\n\n=== SUMMARY ===\n${data.summary}\n\n=== SUBTITLES / TRANSCRIPT ===\n${data.subtitles}\n\n=== DESCRIPTION ===\n${data.description}`;
      await navigator.clipboard.writeText(fullText);
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy all details: ', err);
    }
  };

  const handleDownloadThumbnail = async () => {
    try {
      const response = await fetch(data.thumbnail);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `youtube-thumbnail-${videoId || 'image'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      window.open(data.thumbnail, '_blank');
    }
  };

  const handleDownloadSubtitles = () => {
    const blob = new Blob([data.subtitles], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.title.replace(/[^a-zA-Z0-9]/g, '_')}_subtitles.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadSummary = () => {
    const textContent = `# ${data.title}\n${data.channel ? `Channel: ${data.channel}\n` : ''}Source: ${data.videoUrl}\n\n## Summary\n\n${data.summary}`;
    const blob = new Blob([textContent], { type: 'text/markdown;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.title.replace(/[^a-zA-Z0-9]/g, '_')}_summary.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const parseTimestamp = (ts: string) => {
    const parts = ts.replace(/[\[\]]/g, '').split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  };

  const handleSeekToTimestamp = (seconds: number) => {
    if (player) {
      try {
        player.seekTo(seconds, true);
        player.playVideo();
      } catch (e) {
        console.error(e);
      }
    }
    const playerEl = document.getElementById('youtube-player-container');
    if (playerEl) {
      playerEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [transcriptSearch]);

  const lineTimestamps = useMemo(() => {
    const lines = data.subtitles.split('\n');
    return lines.map(line => {
      const match = line.match(/\[(\d{1,2}:\d{2}(?::\d{2})?)\]/);
      return match ? parseTimestamp(match[1]) : null;
    });
  }, [data.subtitles]);

  // Sync active line with currentTime
  useEffect(() => {
    let bestMatchIndex = -1;
    for (let i = 0; i < lineTimestamps.length; i++) {
      const ts = lineTimestamps[i];
      if (ts !== null && ts <= currentTime) {
        bestMatchIndex = i;
      } else if (ts !== null && ts > currentTime) {
        break;
      }
    }
    if (bestMatchIndex !== activeLineIndex) {
      setActiveLineIndex(bestMatchIndex);
    }
  }, [currentTime, lineTimestamps, activeLineIndex]);

  // Scroll active line into view when playing
  useEffect(() => {
    if (activeLineIndex !== null && !transcriptSearch.trim()) {
      const activeEl = scrollContainerRef.current?.querySelector(`[data-line-index="${activeLineIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeLineIndex, transcriptSearch]);

  const { transcriptContent, totalMatches } = useMemo(() => {
    let matchCounter = 0;
    const lines = data.subtitles.split('\n');
    const searchLower = transcriptSearch.trim().toLowerCase();

    const renderedLines = lines.map((line, lIdx) => {
      const timestampRegex = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g;
      const parts: (string | { type: 'ts'; text: string; value: string })[] = [];
      let lastIndex = 0;
      let match;
      
      while ((match = timestampRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push({ type: 'ts', text: match[0], value: match[1] });
        lastIndex = timestampRegex.lastIndex;
      }
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      const finalParts: React.ReactNode[] = [];
      parts.forEach((part, pIdx) => {
        if (typeof part === 'string') {
          if (!searchLower) {
            finalParts.push(part);
          } else {
            const searchRegex = new RegExp(`(${transcriptSearch})`, 'gi');
            const searchSplits = part.split(searchRegex);
            searchSplits.forEach((sPart, sIdx) => {
              if (sPart.toLowerCase() === searchLower) {
                const currentIdx = matchCounter++;
                finalParts.push(
                  <mark 
                    key={`search-${lIdx}-${pIdx}-${sIdx}`} 
                    className={`px-1 py-0.5 rounded transition-colors duration-300 font-semibold ${
                      currentIdx === currentMatchIndex 
                      ? 'bg-yellow-400 text-black shadow-[0_0_10px_rgba(250,204,21,0.7)] ring-2 ring-yellow-300' 
                      : 'bg-yellow-500/40 text-yellow-100'
                    }`}
                  >
                    {sPart}
                  </mark>
                );
              } else {
                finalParts.push(sPart);
              }
            });
          }
        } else if (part.type === 'ts') {
          finalParts.push(
            <button
              key={`ts-${lIdx}-${pIdx}`}
              type="button"
              onClick={() => handleSeekToTimestamp(parseTimestamp(part.value))}
              title={`Jump to ${part.text}`}
              className="inline-flex items-center gap-1 mx-1.5 px-2 py-0.5 bg-red-600/25 hover:bg-red-600 text-red-300 hover:text-white rounded text-xs font-mono font-bold transition-all border border-red-500/30 shadow-sm active:scale-95 group/btn"
            >
              <i className="fas fa-play text-[9px] group-hover/btn:translate-x-0.5 transition-transform"></i>
              {part.text}
            </button>
          );
        }
      });

      const isActive = activeLineIndex === lIdx;

      return (
        <div 
          key={lIdx} 
          data-line-index={lIdx}
          className={`mb-2.5 p-3 rounded-xl transition-all duration-300 ${
            isActive 
              ? 'bg-gradient-to-r from-red-600/20 to-purple-600/10 border-l-4 border-red-500 shadow-md pl-4' 
              : 'hover:bg-gray-800/60 border border-transparent'
          }`}
        >
          {isActive && (
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">Now Playing</span>
            </div>
          )}
          <div className={`${isActive ? 'text-white font-medium' : 'text-gray-300'} leading-relaxed`}>
            {finalParts}
          </div>
        </div>
      );
    });

    return { transcriptContent: renderedLines, totalMatches: matchCounter };
  }, [data.subtitles, transcriptSearch, currentMatchIndex, activeLineIndex]);

  const handlePrevMatch = () => {
    setCurrentMatchIndex(prev => (totalMatches > 0 ? (prev - 1 + totalMatches) % totalMatches : 0));
  };

  const handleNextMatch = () => {
    setCurrentMatchIndex(prev => (totalMatches > 0 ? (prev + 1) % totalMatches : 0));
  };

  return (
    <div className="w-full max-w-7xl mx-auto animate-fadeIn px-2 sm:px-4 pb-20 space-y-8">
      
      {/* Hero Header Card */}
      <section className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-gray-800 bg-gray-950/80 backdrop-blur-xl">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img 
            src={data.thumbnail} 
            alt="Hero Background" 
            className="w-full h-full object-cover blur-3xl opacity-20 scale-125"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/90 to-transparent"></div>
        </div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 lg:p-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600/20 text-red-400 rounded-full text-xs font-black uppercase tracking-wider border border-red-500/30">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                YouTube Extracted
              </span>
              {data.channel && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-xs font-semibold border border-gray-700">
                  <i className="fas fa-user-circle text-red-400"></i>
                  {data.channel}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
              {data.title}
            </h1>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopyTitle}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                  titleCopied 
                    ? 'bg-green-600/20 border-green-500/40 text-green-300' 
                    : 'bg-gray-800/80 hover:bg-gray-700 text-gray-300 border-gray-700'
                }`}
                title="Copy Title to clipboard"
              >
                <i className={`fas ${titleCopied ? 'fa-check text-green-400' : 'fa-copy'}`}></i>
                {titleCopied ? 'Title Copied' : 'Copy Title'}
              </button>

              <button
                type="button"
                onClick={handleCopySummary}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md ${
                  summaryCopied 
                    ? 'bg-green-600 text-white shadow-green-600/25 ring-2 ring-green-400' 
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-red-600/20'
                }`}
                title="Copy the generated summary to clipboard"
              >
                <i className={`fas ${summaryCopied ? 'fa-check' : 'fa-clipboard'}`}></i>
                {summaryCopied ? 'Summary Copied!' : 'Copy Summary'}
              </button>

              <button
                type="button"
                onClick={handleCopyAll}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                  allCopied 
                    ? 'bg-green-600/20 border-green-500/40 text-green-300' 
                    : 'bg-gray-800/80 hover:bg-gray-700 text-gray-300 border-gray-700'
                }`}
                title="Copy Title, Summary, and Subtitles together"
              >
                <i className={`fas ${allCopied ? 'fa-check text-green-400' : 'fa-layer-group'}`}></i>
                {allCopied ? 'All Details Copied!' : 'Copy All'}
              </button>

              <button 
                type="button"
                onClick={handleDownloadThumbnail}
                className="flex items-center gap-2 px-3.5 py-2 bg-gray-800/80 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold border border-gray-700 transition-all active:scale-95"
              >
                <i className="fas fa-image"></i>
                Thumbnail
              </button>

              <a 
                href={data.videoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-xl text-xs font-semibold border border-red-500/30 transition-all active:scale-95"
              >
                <i className="fab fa-youtube text-red-500"></i>
                Open on YouTube
              </a>
            </div>
          </div>
          
          <div className="lg:col-span-5">
            <div className="relative group rounded-2xl overflow-hidden shadow-2xl border border-gray-800 bg-black aspect-video">
              <img 
                src={data.thumbnail} 
                alt={data.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes('hqdefault')) {
                    target.src = target.src.replace('maxresdefault', 'hqdefault');
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-between p-4">
                <span className="text-white text-xs font-semibold bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                  <i className="fab fa-youtube text-red-500"></i>
                  Ready to stream
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('youtube-player-container');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1 rounded-full transition-colors flex items-center gap-1"
                >
                  <i className="fas fa-play text-[10px]"></i>
                  Watch Player
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Filter */}
        <div className="border-t border-gray-800/80 bg-gray-900/60 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 bg-gray-950/70 p-1 rounded-xl border border-gray-800">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fas fa-th-large mr-1.5"></i>
              All In One
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'summary'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fas fa-sparkles mr-1.5"></i>
              Summary
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('subtitles')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'subtitles'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fas fa-closed-captioning mr-1.5"></i>
              Subtitles
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('description')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'description'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fas fa-align-left mr-1.5"></i>
              Description
            </button>
          </div>

          <div className="text-xs text-gray-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Video ID: <code className="bg-gray-800 px-2 py-0.5 rounded text-white font-mono">{videoId}</code>
          </div>
        </div>
      </section>

      {/* Main Grid: Player on left, Content on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Player & Metadata */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-6 space-y-6">
            
            {/* Embedded Player */}
            <div id="youtube-player-container" className="rounded-2xl overflow-hidden shadow-2xl border border-gray-800 bg-black aspect-video relative group">
              <div id="youtube-player" className="w-full h-full"></div>
            </div>

            {/* Custom Playback Controls Bar */}
            <div className="bg-gray-800/90 border border-gray-700/80 p-4 rounded-2xl shadow-lg space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-300 w-12 text-right">{formatTime(currentTime)}</span>
                <input 
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeekProgress}
                  className="flex-grow h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600 hover:h-2 transition-all"
                />
                <span className="text-xs font-mono text-gray-400 w-12">{formatTime(duration)}</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={togglePlay}
                    className="w-9 h-9 rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all active:scale-95 shadow-md shadow-red-600/20"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-sm`}></i>
                  </button>

                  <div className="flex items-center gap-2 pl-2">
                    <i className={`fas ${volume === 0 ? 'fa-volume-mute text-gray-500' : volume < 50 ? 'fa-volume-down text-gray-300' : 'fa-volume-up text-gray-200'} text-xs`}></i>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-16 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
                      title="Volume"
                    />
                  </div>
                </div>

                <div className="text-xs text-gray-400 flex items-center gap-2">
                  <i className="fas fa-info-circle text-gray-500"></i>
                  <span>Click subtitles to seek</span>
                </div>
              </div>
            </div>

            {/* Quick Metadata Box */}
            <div className="bg-gray-800/80 p-5 rounded-2xl border border-gray-700/80 shadow-lg space-y-3">
              <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                <i className="fas fa-info-circle"></i>
                Video Overview
              </h3>
              
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                  <span className="text-gray-400">Title</span>
                  <span className="text-white font-medium truncate max-w-[200px]" title={data.title}>{data.title}</span>
                </div>
                {data.channel && (
                  <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                    <span className="text-gray-400">Channel</span>
                    <span className="text-white font-medium">{data.channel}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
                  <span className="text-gray-400">Video ID</span>
                  <code className="text-gray-200 font-mono bg-gray-900 px-2 py-0.5 rounded">{videoId}</code>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-400">Direct Link</span>
                  <a 
                    href={data.videoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
                  >
                    Watch on YouTube
                    <i className="fas fa-external-link-alt text-[10px]"></i>
                  </a>
                </div>
              </div>
            </div>

            {/* Sources / Grounding References */}
            {data.sources && data.sources.length > 0 && (
              <div className="bg-gray-800/50 p-5 rounded-2xl border border-gray-700/60">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <i className="fab fa-google text-red-400"></i>
                  Grounding References
                </h3>
                <ul className="space-y-2">
                  {data.sources.map((source, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs">
                      <i className="fas fa-link text-red-500/70 mt-1 text-[10px]"></i>
                      <a 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors line-clamp-1 hover:underline"
                      >
                        {source.title || source.uri}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Summary, Subtitles, and Description */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* SECTION 1: AI GENERATED SUMMARY WITH EXPLICIT 'Copy to Clipboard' BUTTON */}
          {(activeTab === 'all' || activeTab === 'summary') && (
            <section className="bg-gradient-to-br from-gray-800 via-gray-800 to-gray-800/90 p-6 sm:p-8 rounded-3xl border border-red-500/30 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl pointer-events-none -z-0"></div>
              
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-700/60">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/30">
                      <i className="fas fa-sparkles text-white text-lg"></i>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-black text-white">Video Summary</h2>
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-md text-[10px] font-bold uppercase tracking-wider">
                          Key Insights
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5">Concise synthesis of core points and takeaways</p>
                    </div>
                  </div>

                  {/* PROMINENT COPY TO CLIPBOARD BUTTON FOR SUMMARY */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopySummary}
                      id="copy-summary-button"
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95 shadow-lg ${
                        summaryCopied 
                          ? 'bg-green-600 text-white shadow-green-600/30 ring-2 ring-green-400' 
                          : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/25 hover:shadow-red-600/40'
                      }`}
                      title="Copy generated summary text to clipboard"
                    >
                      <i className={`fas ${summaryCopied ? 'fa-check' : 'fa-clipboard'} text-base`}></i>
                      <span>{summaryCopied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadSummary}
                      className="p-2.5 bg-gray-700/80 hover:bg-gray-600 text-gray-300 hover:text-white rounded-xl border border-gray-600 transition-all text-sm active:scale-95"
                      title="Download Summary as Markdown (.md)"
                    >
                      <i className="fas fa-download"></i>
                    </button>
                  </div>
                </div>

                {/* Summary Text Content */}
                <div className="bg-gray-900/60 border border-gray-700/50 rounded-2xl p-5 sm:p-6 text-gray-200 text-sm leading-relaxed space-y-4">
                  <div className="whitespace-pre-wrap font-sans text-gray-200 leading-relaxed space-y-3">
                    {data.summary}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                  <span>Generated with Gemini 3 Flash & Search Grounding</span>
                  <button 
                    type="button"
                    onClick={handleCopySummary}
                    className="text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 font-medium"
                  >
                    <i className="fas fa-copy text-[11px]"></i>
                    {summaryCopied ? 'Copied to clipboard' : 'Click to copy summary'}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 2: SUBTITLES & INTERACTIVE TRANSCRIPT */}
          {(activeTab === 'all' || activeTab === 'subtitles') && (
            <section className="bg-gray-800 rounded-3xl border border-gray-700 shadow-xl overflow-hidden flex flex-col">
              <div className="p-6 sm:p-8 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/30">
                      <i className="fas fa-closed-captioning text-white text-lg"></i>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-black text-white">Subtitles & Transcript</h2>
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-md text-[10px] font-bold uppercase tracking-wider">
                          Timestamped
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5">Click any timestamp to jump player to that point</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopySubtitles}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap active:scale-95 shadow-md ${
                        subtitlesCopied 
                          ? 'bg-green-600 text-white shadow-green-600/20 ring-2 ring-green-400' 
                          : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20'
                      }`}
                      title="Copy all subtitles / transcript to clipboard"
                    >
                      <i className={`fas ${subtitlesCopied ? 'fa-check' : 'fa-copy'}`}></i>
                      {subtitlesCopied ? 'Subtitles Copied!' : 'Copy Subtitles'}
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadSubtitles}
                      className="p-2 bg-gray-700/80 hover:bg-gray-600 text-gray-300 hover:text-white rounded-xl border border-gray-600 transition-all text-xs active:scale-95"
                      title="Download Subtitles (.txt)"
                    >
                      <i className="fas fa-file-arrow-down"></i>
                    </button>
                  </div>
                </div>

                {/* Subtitle Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4">
                  <div className="relative flex-grow">
                    <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                    <input 
                      type="text" 
                      placeholder="Search within subtitles / transcript..."
                      value={transcriptSearch}
                      onChange={(e) => setTranscriptSearch(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl py-2.5 pl-10 pr-10 text-xs text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500 transition-all"
                    />
                    {transcriptSearch && (
                      <button 
                        type="button"
                        onClick={() => setTranscriptSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        title="Clear search"
                      >
                        <i className="fas fa-times-circle text-xs"></i>
                      </button>
                    )}
                  </div>

                  {transcriptSearch && totalMatches > 0 && (
                    <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-700 rounded-xl px-2.5 py-1.5">
                      <span className="text-xs text-gray-300 font-mono px-2 border-r border-gray-700">
                        {currentMatchIndex + 1} / {totalMatches}
                      </span>
                      <button 
                        type="button"
                        onClick={handlePrevMatch}
                        className="p-1 hover:bg-gray-800 rounded-lg text-gray-300 hover:text-white transition-colors"
                        title="Previous match"
                      >
                        <i className="fas fa-chevron-up text-xs"></i>
                      </button>
                      <button 
                        type="button"
                        onClick={handleNextMatch}
                        className="p-1 hover:bg-gray-800 rounded-lg text-gray-300 hover:text-white transition-colors"
                        title="Next match"
                      >
                        <i className="fas fa-chevron-down text-xs"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Subtitles Scrollable List */}
              <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-2">
                <div className="relative bg-gray-900/80 border border-gray-700/60 rounded-2xl overflow-hidden shadow-inner">
                  <div 
                    ref={scrollContainerRef}
                    className="max-h-[550px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent p-5 sm:p-6 font-sans text-sm leading-relaxed text-gray-200"
                  >
                    {transcriptContent}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none opacity-60"></div>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 3: VIDEO DESCRIPTION */}
          {(activeTab === 'all' || activeTab === 'description') && (
            <section className="bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-700 shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-700/60">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                    <i className="fas fa-align-left text-white text-lg"></i>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">Video Description</h2>
                    <p className="text-gray-400 text-xs mt-0.5">Original metadata and creator notes</p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={handleCopyDescription}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-md ${
                    descCopied 
                    ? 'bg-green-600 text-white shadow-green-600/20 ring-2 ring-green-400' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600'
                  }`}
                  title="Copy video description to clipboard"
                >
                  <i className={`fas ${descCopied ? 'fa-check' : 'fa-copy'}`}></i>
                  {descCopied ? 'Description Copied!' : 'Copy Description'}
                </button>
              </div>
              
              <div className="bg-gray-900/60 border border-gray-700/50 rounded-2xl p-5 sm:p-6 text-gray-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
                {data.description}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoDetails;
