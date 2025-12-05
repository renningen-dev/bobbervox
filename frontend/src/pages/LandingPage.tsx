import { useNavigate } from "react-router-dom";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { useThemeStore } from "../stores/themeStore";
import { useAuthStore } from "../stores/authStore";
import { useEffect, useState } from "react";
import { SUPPORTED_LANGUAGES } from "../types";

export function LandingPage() {
  const navigate = useNavigate();
  const { isDark, toggle } = useThemeStore();
  const { isAuthenticated, isLoading } = useAuthStore();
  const [imageError, setImageError] = useState(false);

  // Redirect to projects if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/projects", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/projects");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative transition-colors overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-100 via-gray-50 to-purple-100 dark:from-indigo-950/20 dark:via-gray-900 dark:to-purple-950/20 pointer-events-none" />

      {/* Theme toggle */}
      <button
        onClick={toggle}
        className="absolute top-4 right-4 z-20 p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5 transition-all backdrop-blur-xl border border-white/50 dark:border-white/10"
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
      </button>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Bobber VOX" className="h-10 w-10" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">Bobber VOX</span>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-hidden overflow-y-auto">
          <div className="w-full max-w-none px-6 lg:px-12 py-12 flex flex-col lg:flex-row gap-12 lg:gap-8 items-center">
            {/* Left side - Text content */}
            <div className="space-y-8 lg:w-[30%] flex-shrink-0 lg:pl-8">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                  Video Dubbing
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
                    Made Simple
                  </span>
                </h1>
                <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-lg">
                  Upload your video, select segments, and let AI transcribe, translate, and generate natural-sounding voice-overs in any language.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleGetStarted}
                  className="w-full px-24 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all transform hover:scale-105"
                >
                  Get Started
                </button>
              </div>

              {/* Features list */}
              <div className="grid sm:grid-cols-2 gap-4 pt-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">AI Transcription</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Automatic speech-to-text with GPT-4</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Smart Translation</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Context-aware multilingual translation</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Natural TTS</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">High-quality voice synthesis</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Waveform Editor</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Visual segment selection</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - App screenshot */}
            <div className="relative flex-1 w-full lg:w-[60%] lg:-mr-8">
              <div className="relative max-w-2xl lg:max-w-none mx-auto">
                {/* Glow effect behind screenshot */}
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur-2xl" />

                {/* Screenshot container */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/20 border border-white/20 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-xl">
                  {!imageError ? (
                    <img
                      src="/screenshot.png"
                      alt="Bobber VOX App Screenshot"
                      className="w-full h-auto"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    /* Fallback placeholder if no screenshot */
                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                      <div className="text-center text-gray-400 dark:text-gray-600">
                        <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">App Screenshot</p>
                        <p className="text-xs mt-1">Place screenshot.png in public/</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="w-full max-w-5xl mx-auto px-6 py-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">1</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Upload & Extract</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Upload your video and automatically extract the audio track for processing.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">2</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Select Segments</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Use the waveform editor to select specific audio segments you want to dub.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">3</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI Dubbing</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  AI transcribes, translates, and generates natural voice-overs in your target language.
                </p>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="w-full max-w-5xl mx-auto px-6 py-16">
            <div className="rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 p-8 overflow-hidden">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                {/* Image on the left */}
                <div className="w-full md:w-2/5 flex-shrink-0">
                  <div className="relative rounded-xl overflow-hidden shadow-lg">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl blur" />
                    <img
                      src="/about.png"
                      alt="Video dubbing illustration"
                      className="relative w-full h-auto rounded-xl"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    {/* Fallback placeholder */}
                    <div className="hidden aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-xl flex items-center justify-center">
                      <div className="text-center text-gray-400 dark:text-gray-600">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs">about.png</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Text on the right */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Create High-Quality Dubbing for Your Videos
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Bobber VOX is designed to help content creators, educators, and businesses reach global audiences
                    by providing professional-quality video dubbing powered by cutting-edge AI technology.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Supported Languages Section */}
          <div className="w-full max-w-5xl mx-auto px-6 py-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
              Supported Languages
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <div
                  key={lang.code}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10"
                >
                  <img src={lang.flag} alt={lang.name} className="w-5 h-5 rounded-full object-cover" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{lang.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Section */}
          <div className="w-full max-w-5xl mx-auto px-6 py-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
              Pricing
            </h2>
            <div className="rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 p-8">
              <div className="text-center mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">Free</span>
                <span className="text-gray-600 dark:text-gray-400 ml-2">to use</span>
              </div>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                Bobber VOX is free and open source. You only pay for the OpenAI API usage.
              </p>
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-amber-800 dark:text-amber-300">OpenAI API Key Required</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                      You'll need your own OpenAI API key to use the transcription, translation, and text-to-speech features.
                      Configure it in Settings after signing in.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-6 text-center">Estimated OpenAI API Costs</h4>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-500/10 dark:to-indigo-500/5 border border-indigo-200/50 dark:border-indigo-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white">Transcription & Translation</div>
                    </div>
                    <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">~$0.02</div>
                    <div className="text-gray-600 dark:text-gray-400">per minute of audio</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">One API call using GPT-4o Audio</div>
                  </div>
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-500/10 dark:to-purple-500/5 border border-purple-200/50 dark:border-purple-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white">Voice Generation (TTS)</div>
                    </div>
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">~$0.02</div>
                    <div className="text-gray-600 dark:text-gray-400">per minute of output</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">~1000 characters per minute</div>
                  </div>
                </div>
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200/30 dark:border-white/10 text-center">
                  <span className="text-gray-600 dark:text-gray-400">Total: approximately </span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">$0.04 per minute</span>
                  <span className="text-gray-600 dark:text-gray-400"> of dubbed audio</span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="w-full max-w-5xl mx-auto px-6 py-16 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Start Dubbing?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Sign up for free and start creating professional video dubs in minutes.
            </p>
            <button
              onClick={handleGetStarted}
              className="px-12 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all transform hover:scale-105"
            >
              Get Started
            </button>
          </div>

          {/* Footer */}
          <footer className="w-full max-w-5xl mx-auto px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-500 border-t border-white/50 dark:border-white/10">
            <p>© {new Date().getFullYear()} Bobber VOX. Open source project.</p>
          </footer>
        </main>

      </div>
    </div>
  );
}
