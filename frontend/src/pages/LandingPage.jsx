import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SparklesCore } from '../components/ui/sparkles';
import { ContainerScroll } from '../components/ui/container-scroll-animation';
import { AnimatedHero } from '../components/ui/animated-hero';
import MindTraceFooter from '../components/ui/mindtrace-footer';
import { CheckCircle, BarChart3, Users, Award } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white" style={{ zoom: '0.9' }}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Award className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">MindTrace</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#product" className="text-gray-600 hover:text-gray-900 transition-colors">
                Product
              </a>
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
                Pricing
              </a>
              <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">
                About
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Log in
              </button>
              <button
                onClick={() => navigate('/login')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Sign up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Sparkles - Exact Match */}
      <div className="h-screen relative w-full bg-white flex flex-col items-center justify-center overflow-hidden">
        <h1 className="md:text-7xl text-3xl lg:text-9xl font-bold text-center text-gray-900 relative z-20">
          MindTrace
        </h1>
        <div className="w-[40rem] h-40 relative">
          {/* Gradients */}
          <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm" />
          <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4" />
          <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] w-1/4 blur-sm" />
          <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px w-1/4" />
          {/* Core component */}
          <SparklesCore
            background="transparent"
            minSize={0.4}
            maxSize={1}
            particleDensity={1200}
            className="w-full h-full"
            particleColor="#000000"
          />
          {/* Radial Gradient to prevent sharp edges */}
          <div className="absolute inset-0 w-full h-full bg-white [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]"></div>
        </div>
        <p className="text-xl text-gray-600 mt-8 max-w-2xl text-center px-4 relative z-20">
          Explainable Mentor Evaluation System
        </p>
      </div>

      {/* Scroll Animation Section */}
      <div className="bg-white">
        <ContainerScroll
          titleComponent={
            <div className="text-center">
              <h2 className="text-4xl md:text-6xl font-bold mb-4 text-gray-900">
                Unleash the power of
              </h2>
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-600">
                AI-Powered Evaluation
              </h2>
            </div>
          }
        >
          <img
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&h=720&fit=crop"
            alt="dashboard preview"
            className="mx-auto rounded-2xl object-cover h-full w-full"
            draggable={false}
          />
        </ContainerScroll>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-gray-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Powerful Features for Better Teaching
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to evaluate and improve teaching quality
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">AI-Powered Analysis</h3>
              <p className="text-gray-600 mb-4">
                Advanced LLM technology analyzes teaching sessions across multiple dimensions including clarity, structure, correctness, pacing, and communication.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Segment-by-segment evaluation</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Detailed scoring metrics</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Explainable feedback</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Mentor Management</h3>
              <p className="text-gray-600 mb-4">
                Comprehensive dashboard to manage mentors, track their performance over time, and identify trends in teaching quality.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Performance tracking</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Trend analysis</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Individual insights</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Visual Insights</h3>
              <p className="text-gray-600 mb-4">
                Interactive visualizations help you understand teaching flow, identify strengths, and pinpoint areas for improvement at a glance.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Flow visualizations</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Performance charts</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Actionable feedback</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <div className="bg-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              How MindTrace Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple workflow, powerful results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                1
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Upload Video</h3>
              <p className="text-gray-600">
                Upload your teaching session video to the platform
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                2
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">AI Transcription</h3>
              <p className="text-gray-600">
                Automatic transcription with timestamp precision
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                3
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Smart Analysis</h3>
              <p className="text-gray-600">
                AI evaluates teaching quality across multiple metrics
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                4
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Get Insights</h3>
              <p className="text-gray-600">
                Receive detailed feedback and actionable recommendations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section - Animated Hero */}
      <AnimatedHero />

      {/* Footer */}
      <MindTraceFooter />
    </div>
  );
};

export default LandingPage;