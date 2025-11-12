import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Heart, Shuffle, Repeat, List, Loader2 } from 'lucide-react';
import { usePlayer } from '../services/player';
import { useNavigate } from 'react-router-dom';

export default function PlayerBar() {
  const navigate = useNavigate();
  const {
    currentTrack,
    state,
    progress,
    duration,
    volume,
    queue,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
    like,
    unlike,
    isLiked,
  } = usePlayer();

  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);

  const liked = currentTrack ? isLiked(currentTrack.videoId) : false;

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration || duration === 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seek(percent * duration);
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeBarRef.current) return;
    const rect = volumeBarRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    setVolume(Math.max(0, Math.min(1, percent)));
  };

  const handleToggleLike = async () => {
    if (!currentTrack) return;
    if (liked) {
      await unlike(currentTrack.videoId);
    } else {
      await like(currentTrack);
    }
  };

  if (!currentTrack) {
    return null;
  }

  return (
    <div className="h-24 bg-black border-t border-gray-800 px-4 flex items-center justify-between">
      {/* Left: Track Info */}
      <div className="flex items-center gap-4 w-80">
        <img
          src={currentTrack.thumbnail}
          alt={currentTrack.title}
          className="w-14 h-14 rounded"
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-white text-sm font-semibold truncate">
            {currentTrack.title}
          </h4>
          <p className="text-gray-400 text-xs truncate">{currentTrack.artist}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleToggleLike}
          className="text-gray-400 hover:text-white"
        >
          <Heart
            size={20}
            className={liked ? 'fill-green-500 text-green-500' : ''}
          />
        </motion.button>
      </div>

      {/* Center: Player Controls */}
      <div className="flex-1 max-w-2xl">
        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4 mb-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="text-gray-400 hover:text-white"
          >
            <Shuffle size={18} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={prev}
            className="text-gray-400 hover:text-white"
          >
            <SkipBack size={20} fill="currentColor" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={togglePlay}
            disabled={state === 'loading'}
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state === 'loading' ? (
              <Loader2 size={18} className="animate-spin" />
            ) : state === 'playing' ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" className="ml-0.5" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={next}
            className="text-gray-400 hover:text-white"
          >
            <SkipForward size={20} fill="currentColor" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="text-gray-400 hover:text-white"
          >
            <Repeat size={18} />
          </motion.button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-10 text-right">
            {formatTime(progress)}
          </span>
          <div
            ref={progressBarRef}
            onClick={handleProgressClick}
            className="flex-1 h-1 bg-gray-600 rounded-full cursor-pointer group relative"
          >
            <motion.div
              className="h-full bg-white rounded-full relative"
              style={{ width: `${duration > 0 ? Math.min(100, (progress / duration) * 100) : 0}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-lg" />
            </motion.div>
          </div>
          <span className="text-xs text-gray-400 w-10">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right: Volume & Queue */}
      <div className="flex items-center gap-4 w-80 justify-end">
        {/* Queue Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/queue')}
          className="text-gray-400 hover:text-white relative"
          title={`Queue (${queue.length} songs)`}
        >
          <List size={20} />
          {queue.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
              {queue.length > 9 ? '9+' : queue.length}
            </span>
          )}
        </motion.button>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
            className="text-gray-400 hover:text-white"
          >
            {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <div
            ref={volumeBarRef}
            onClick={handleVolumeClick}
            className="w-24 h-1 bg-gray-600 rounded-full cursor-pointer group relative"
          >
            <motion.div
              className="h-full bg-white rounded-full relative"
              style={{ width: `${volume * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-lg" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
