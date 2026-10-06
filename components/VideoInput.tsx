import React, { useState } from 'react';

interface VideoInputProps {
  onSearch: (url: string) => void;
  isLoading: boolean;
}

const SAMPLE_VIDEOS = [
  {
    title: 'Steve Jobs 2005 Stanford Speech',
    url: 'https://www.youtube.com/watch?v=UF8uR6Z6KLc',
    tag: 'Classic Speech',
  },
  {
    title: 'Veritasium: How Quantum Computers Work',
    url: 'https://www.youtube.com/watch?v=JhHMJCUmq28',
    tag: 'Science',
  },
  {
    title: 'React in 100 Seconds',
    url: 'https://www.youtube.com/watch?v=Tn6-PIqc4UM',
    tag: 'Tech',
  },
];

const VideoInput: React.FC<VideoInputProps> = ({ onSearch, isLoading }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSearch(url.trim());
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.includes('youtu')) {
        setUrl(text.trim());
      }
    } catch (err) {
      // ignore
    }
  };

  const handleSampleClick = (sampleUrl: string) => {
    setUrl(sampleUrl);
    onSearch(sampleUrl);
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-10 px-4">
      <form onSubmit={handleSubmit}>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 via-purple-600 to-red-600 rounded-2xl blur-md opacity-30 group-hover:opacity-60 transition duration-700"></div>
          <div className="relative flex flex-col sm:flex-row gap-3 bg-gray-900/90 p-2 rounded-2xl border border-gray-700/80 shadow-2xl backdrop-blur-sm">
            <div className="relative flex-grow flex items-center">
              <i className="fab fa-youtube text-red-500 absolute left-4 text-xl"></i>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste any YouTube video or shorts link..."
                className="w-full pl-12 pr-12 py-3.5 bg-transparent rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none"
                disabled={isLoading}
              />
              {url ? (
                <button
                  type="button"
                  onClick={() => setUrl('')}
                  className="absolute right-3 text-gray-500 hover:text-white p-1"
                  title="Clear input"
                >
                  <i className="fas fa-times-circle text-sm"></i>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePaste}
                  className="absolute right-3 text-gray-500 hover:text-red-400 p-1 text-xs"
                  title="Paste from clipboard"
                >
                  <i className="fas fa-paste"></i>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="px-6 py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-red-600/20 active:scale-95"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-circle-notch animate-spin text-sm"></i>
                  <span>Analyzing Video...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-sparkles text-sm text-yellow-300"></i>
                  <span>Get Insights</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Quick Try Samples */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-gray-400">
        <span className="text-gray-500 flex items-center gap-1">
          <i className="fas fa-bolt text-yellow-500"></i>
          Try samples:
        </span>
        {SAMPLE_VIDEOS.map((sample, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSampleClick(sample.url)}
            disabled={isLoading}
            className="px-2.5 py-1 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 hover:border-red-500/50 rounded-lg text-gray-300 hover:text-white transition-all text-[11px] disabled:opacity-50"
          >
            <span className="text-red-400 font-semibold mr-1">#{sample.tag}</span>
            {sample.title}
          </button>
        ))}
      </div>

      <p className="mt-2 text-center text-gray-500 text-xs">
        Extracts Title, Creator Description, AI Summary, and Timestamped Subtitles / Transcript.
      </p>
    </div>
  );
};

export default VideoInput;
