import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SparklesCore } from '../components/ui/sparkles';
import { ContainerScroll } from '../components/ui/container-scroll-animation';
import { AnimatedHero } from '../components/ui/animated-hero';
import { Footer } from '../components/ui/modern-animated-footer';
import { CheckCircle, BarChart3, Users, Award, Sun, Moon } from 'lucide-react';

const LOGO_URL = "/logo.png";

const LandingPage = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-black' : 'bg-white'}`} style={{ zoom: '0.95' }}>
      
      {/* Navigation - Logo is on the TOP LEFT here */}
      <nav className={`fixed top-0 w-full z-50 backdrop-blur-md border-b transition-colors duration-300 ${
        darkMode 
          ? 'bg-black/80 border-white/20' 
          : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              {/* Replaced Icon with Logo Image */}
              <img 
                src={LOGO_URL} 
                alt="MindTrace Logo" 
                className="w-10 h-10 object-contain drop-shadow-md" 
              />
              <span className={`text-xl font-bold transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                MindTrace
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#product" className={`transition-colors ${
                darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}>
                Product
              </a>
              <a href="#features" className={`transition-colors ${
                darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}>
                Features
              </a>
              <a href="#pricing" className={`transition-colors ${
                darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}>
                Pricing
              </a>
              <a href="#about" className={`transition-colors ${
                darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}>
                About
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-white/10 text-white hover:bg-white/20' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => navigate('/login')}
                className={`transition-colors ${
                  darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Log in
              </button>
              <button
                onClick={() => navigate('/login')}
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                  darkMode 
                    ? 'bg-white text-black hover:bg-gray-200' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Sign up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Sparkles */}
      <div className={`h-screen relative w-full flex flex-col items-center justify-center overflow-hidden transition-colors duration-300 ${
        darkMode ? 'bg-black' : 'bg-white'
      }`}>
        <h1 className={`md:text-7xl text-3xl lg:text-9xl font-bold text-center relative z-20 transition-colors duration-300 ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          MindTrace
        </h1>
        <div className="w-[40rem] h-40 relative">
          <div className={`absolute inset-x-20 top-0 h-[2px] w-3/4 blur-sm ${
            darkMode 
              ? 'bg-gradient-to-r from-transparent via-white to-transparent' 
              : 'bg-gradient-to-r from-transparent via-indigo-500 to-transparent'
          }`} />
          <div className={`absolute inset-x-20 top-0 h-px w-3/4 ${
            darkMode 
              ? 'bg-gradient-to-r from-transparent via-white to-transparent' 
              : 'bg-gradient-to-r from-transparent via-indigo-500 to-transparent'
          }`} />
          <div className={`absolute inset-x-60 top-0 h-[5px] w-1/4 blur-sm ${
            darkMode 
              ? 'bg-gradient-to-r from-transparent via-gray-300 to-transparent' 
              : 'bg-gradient-to-r from-transparent via-sky-500 to-transparent'
          }`} />
          <div className={`absolute inset-x-60 top-0 h-px w-1/4 ${
            darkMode 
              ? 'bg-gradient-to-r from-transparent via-gray-300 to-transparent' 
              : 'bg-gradient-to-r from-transparent via-sky-500 to-transparent'
          }`} />
          <SparklesCore
            background="transparent"
            minSize={0.4}
            maxSize={1}
            particleDensity={1200}
            className="w-full h-full"
            particleColor={darkMode ? "#FFFFFF" : "#000000"}
          />
          <div className={`absolute inset-0 w-full h-full ${
            darkMode 
              ? 'bg-black [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,black)]' 
              : 'bg-white [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]'
          }`}></div>
        </div>
        <p className={`text-xl mt-8 max-w-2xl text-center px-4 relative z-20 transition-colors duration-300 ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Explainable Mentor Evaluation System
        </p>
      </div>

      {/* Scroll Animation Section */}
      <div className={`transition-colors duration-300 ${darkMode ? 'bg-black' : 'bg-white'}`}>
        <ContainerScroll
          titleComponent={
            <div className="text-center">
              <h2 className={`text-4xl md:text-6xl font-bold mb-4 transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Unleash the power of
              </h2>
              <h2 className={`text-5xl md:text-7xl lg:text-8xl font-bold bg-clip-text text-transparent transition-colors duration-300 ${
                darkMode 
                  ? 'bg-gradient-to-b from-white to-gray-400' 
                  : 'bg-gradient-to-b from-gray-900 to-gray-600'
              }`}>
                AI-Powered Evaluation
              </h2>
            </div>
          }
        >
          <img
            src="/landing-dashboard-preview.png"
            alt="dashboard preview"
            className="mx-auto rounded-2xl object-cover h-full w-full"
            draggable={false}
          />
        </ContainerScroll>
      </div>

      {/* Features Section */}
      <div id="features" className={`py-20 px-4 transition-colors duration-300 ${
        darkMode ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold mb-4 transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Powerful Features for Better Teaching
            </h2>
            <p className={`text-xl transition-colors duration-300 ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Everything you need to evaluate and improve teaching quality
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className={`rounded-xl p-8 hover:shadow-xl transition-all duration-300 ${
              darkMode 
                ? 'bg-white/5 border border-white/10 hover:border-white/20' 
                : 'bg-white border border-gray-200'
            }`}>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 ${
                darkMode ? 'bg-white/10' : 'bg-blue-100'
              }`}>
                <BarChart3 className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-blue-600'}`} />
              </div>
              <h3 className={`text-2xl font-bold mb-4 transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                AI-Powered Analysis
              </h3>
              <p className={`mb-4 transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Advanced LLM technology analyzes teaching sessions across multiple dimensions including clarity, structure, correctness, pacing, and communication.
              </p>
            </div>
            <div className={`rounded-xl p-8 hover:shadow-xl transition-all duration-300 ${
              darkMode 
                ? 'bg-white/5 border border-white/10 hover:border-white/20' 
                : 'bg-white border border-gray-200'
            }`}>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 ${
                darkMode ? 'bg-white/10' : 'bg-purple-100'
              }`}>
                <Users className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-purple-600'}`} />
              </div>
              <h3 className={`text-2xl font-bold mb-4 transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Mentor Management
              </h3>
              <p className={`mb-4 transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Comprehensive dashboard to manage mentors, track their performance over time, and identify trends in teaching quality.
              </p>
            </div>
            <div className={`rounded-xl p-8 hover:shadow-xl transition-all duration-300 ${
              darkMode 
                ? 'bg-white/5 border border-white/10 hover:border-white/20' 
                : 'bg-white border border-gray-200'
            }`}>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 ${
                darkMode ? 'bg-white/10' : 'bg-green-100'
              }`}>
                <Award className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-green-600'}`} />
              </div>
              <h3 className={`text-2xl font-bold mb-4 transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Visual Insights
              </h3>
              <p className={`mb-4 transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Interactive visualizations help you understand teaching flow, identify strengths, and pinpoint areas for improvement at a glance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <div className={`py-20 px-4 transition-colors duration-300 ${
        darkMode ? 'bg-black' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold mb-4 transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              How MindTrace Works
            </h2>
            <p className={`text-xl transition-colors duration-300 ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Simple workflow, powerful results
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold transition-colors duration-300 ${
                darkMode ? 'bg-white text-black' : 'bg-blue-600 text-white'
              }`}>1</div>
              <h3 className={`text-xl font-bold mb-2 transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Upload Video</h3>
              <p className={`transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Upload your teaching session video to the platform</p>
            </div>
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold transition-colors duration-300 ${
                darkMode ? 'bg-white text-black' : 'bg-purple-600 text-white'
              }`}>2</div>
              <h3 className={`text-xl font-bold mb-2 transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>AI Transcription</h3>
              <p className={`transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Automatic transcription with timestamp precision</p>
            </div>
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold transition-colors duration-300 ${
                darkMode ? 'bg-white text-black' : 'bg-green-600 text-white'
              }`}>3</div>
              <h3 className={`text-xl font-bold mb-2 transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Smart Analysis</h3>
              <p className={`transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>AI evaluates teaching quality across multiple metrics</p>
            </div>
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold transition-colors duration-300 ${
                darkMode ? 'bg-white text-black' : 'bg-yellow-500 text-white'
              }`}>4</div>
              <h3 className={`text-xl font-bold mb-2 transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Get Insights</h3>
              <p className={`transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Receive detailed feedback and actionable recommendations</p>
            </div>
          </div>
        </div>
      </div>

      <div className={darkMode ? 'dark' : ''}>
        <AnimatedHero />
      </div>

      <div className={darkMode ? 'dark' : ''}>
        <Footer 
          brandName="MindTrace"
          brandDescription="AI-Powered Mentor Evaluation & Analytics"
          brandIcon={
            <img src={LOGO_URL} alt="MindTrace Logo" className="w-full h-full object-cover" />
          }
        />
      </div>
    </div>
  );
};

export default LandingPage;