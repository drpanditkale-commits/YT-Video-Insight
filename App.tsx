import React, { useState } from 'react';
import VideoInput from './components/VideoInput';
import VideoDetails from './components/VideoDetails';
import { AppState } from './types';
import { fetchVideoDetails } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    loading: false,
    error: null,
    data: null,
  });

  const handleSearch = async (url: string) => {
    setState({ ...state, loading: true, error: null });
    try {
      const result = await fetchVideoDetails(url);
      setState({ loading: false, data: result, error: null });
    } catch (err) {
      setState({
        loading: false,
        data: null,
        error: err instanceof Error ? err.message : 'An unknown error occurred',
      });
    }
  };

  const handleReset = () => {
    setState({ loading: false, error: null, data: null });
  };

  return (
    <div className="min-h-screen bg-gray-900 selection:bg-red-500/30 flex flex-col">
      {/* Header */}
      <header className="pt-12 pb-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-red-600/10 blur-[120px] rounded-full -z-10"></div>
        <div className="flex flex-col items-center gap-3 px-4">
          <div 
            onClick={handleReset}
            className="w-14 h-14 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/30 mb-1 rotate-2 hover:rotate-0 transition-transform cursor-pointer"
            title="Reset to home"
          >
            <i className="fab fa-youtube text-2xl text-white"></i>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
            YT <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-rose-600">Video Insight</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto px-4 font-normal">
            Extract <span className="text-gray-200 font-semibold">Title</span>, <span className="text-gray-200 font-semibold">Description</span>, <span className="text-gray-200 font-semibold">AI Summary</span>, and timestamped <span className="text-gray-200 font-semibold">Subtitles</span> with instant Copy to Clipboard.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 flex-grow">
        <VideoInput onSearch={handleSearch} isLoading={state.loading} />

        {state.error && (
          <div className="max-w-2xl mx-auto mb-10 animate-bounceIn px-4">
            <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-2xl flex items-start gap-3.5 text-red-200 shadow-xl">
              <i className="fas fa-exclamation-triangle text-xl text-red-400 mt-0.5"></i>
              <div>
                <p className="font-bold text-sm text-red-100">Extraction Error</p>
                <p className="text-xs text-red-300/90 mt-0.5">{state.error}</p>
                <p className="text-[11px] text-red-400/80 mt-1">Please check the YouTube URL or ensure the video is publicly accessible.</p>
              </div>
            </div>
          </div>
        )}

        {!state.loading && !state.data && !state.error && (
          <div className="max-w-4xl mx-auto py-8 text-center space-y-10 px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FeatureCard 
                icon="fa-sparkles" 
                title="AI Summary" 
                description="Synthesizes core concepts and key takeaways into a structured summary with 1-click clipboard copy." 
                color="text-amber-400"
              />
              <FeatureCard 
                icon="fa-closed-captioning" 
                title="Timestamped Subtitles" 
                description="Chronological transcript with clickable timestamps that jump to exact moments in playback." 
                color="text-purple-400"
              />
              <FeatureCard 
                icon="fa-align-left" 
                title="Title & Description" 
                description="Retrieves the creator's full title, description, channel details, and high-resolution thumbnail." 
                color="text-blue-400"
              />
            </div>

            <div className="p-6 bg-gray-800/30 border border-gray-800 rounded-2xl max-w-2xl mx-auto text-left flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center shrink-0">
                <i className="fas fa-clipboard-check text-lg"></i>
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                <p className="text-white font-semibold text-sm">One-Click Copy & Export</p>
                <p>
                  Copy the entire summary, subtitles, title, or video description to your clipboard instantly with visual confirmation, or download them as Markdown and text files.
                </p>
              </div>
            </div>
          </div>
        )}

        {state.loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-700 border-t-red-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <i className="fab fa-youtube text-red-500 animate-pulse text-xl"></i>
              </div>
            </div>
            <div className="text-center px-4">
              <p className="text-xl font-bold text-white mb-2">Analyzing Video & Subtitles</p>
              <p className="text-gray-400 text-sm max-w-md">Gemini is searching YouTube grounding data to extract title, description, summary, and timestamped subtitles...</p>
            </div>
          </div>
        )}

        {state.data && !state.loading && (
          <VideoDetails data={state.data} />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-8 text-center border-t border-gray-800 text-gray-500 text-xs">
        <p>Built with Gemini 3 Flash & Google Search Grounding</p>
        <div className="flex justify-center gap-4 mt-3">
          <span className="hover:text-red-400 transition-colors flex items-center gap-1.5">
            <i className="fab fa-youtube text-red-500"></i> YouTube
          </span>
          <span className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
            <i className="fas fa-clipboard-check text-amber-500"></i> Copy to Clipboard
          </span>
          <span className="hover:text-purple-400 transition-colors flex items-center gap-1.5">
            <i className="fas fa-closed-captioning text-purple-400"></i> Subtitles
          </span>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: string; title: string; description: string; color: string }> = ({ icon, title, description, color }) => (
  <div className="p-6 bg-gray-800/40 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all group text-left">
    <div className="w-12 h-12 rounded-xl bg-gray-900/90 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
      <i className={`fas ${icon} ${color} text-lg`}></i>
    </div>
    <h3 className="text-white font-bold text-base mb-1.5">{title}</h3>
    <p className="text-gray-400 text-xs leading-relaxed">{description}</p>
  </div>
);

export default App;
