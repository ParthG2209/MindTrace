import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SparklesCore } from '../components/ui/sparkles';
import { ContainerScroll } from '../components/ui/container-scroll-animation';
import { AnimatedHero } from '../components/ui/animated-hero';
import MindTraceFooter from '../components/ui/mindtrace-footer';
import { ArrowRight, CheckCircle, BarChart3, Users, Award } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Award className="w-6 h-6 text-blue-500" />
              <span className="text-xl font-bold">MindTrace</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#product" className="text-gray-300 hover:text-white transition-colors">
                Product
              </a>
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">
                Pricing
              </a>
              <a href="#about" className="text-gray-300 hover:text-white transition-colors">
                About
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Log in
              </button>
              <button
                onClick={() => navigate('/login')}
                className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Sign up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Sparkles */}
      <div className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        <div className="w-full absolute inset-0 h-screen">
          <SparklesCore
            id="tsparticlesfullpage"
            background="transparent"
            minSize={0.6}
            maxSize={1.4}
            particleDensity={100}
            className="w-full h-full"
            particleColor="#FFFFFF"
            speed={1}
          />
        </div>
        <div className="relative z-20 text-center px-4">
          <h1 className="text-5xl md:text-7xl lg:text-9xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
            MindTrace
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Explainable Mentor Evaluation System
          </p>
          <p className="text-lg text-gray-400 mb-8 max-w-3xl mx-auto">
            Meet the system for modern teaching evaluation. Streamline assessments, analyze performance, and track teaching quality with AI-powered insights.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-flex items-center"
          >
            Start Evaluating
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scroll Animation Section */}
      <div className="bg-black">
        <ContainerScroll
          titleComponent={
            <div className="text-center">
              <h2 className="text-4xl md:text-6xl font-bold mb-4 text-white">
                Unleash the power of
              </h2>
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
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
      <div id="features" className="bg-black py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Powerful Features for Better Teaching
            </h2>
            <p className="text-xl text-gray-400">
              Everything you need to evaluate and improve teaching quality
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl p-8 hover:border-blue-500 transition-colors">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold mb-4">AI-Powered Analysis</h3>
              <p className="text-gray-400 mb-4">
                Advanced LLM technology analyzes teaching sessions across multiple dimensions including clarity, structure, correctness, pacing, and communication.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Segment-by-segment evaluation</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Detailed scoring metrics</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Explainable feedback</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl p-8 hover:border-blue-500 transition-colors">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Mentor Management</h3>
              <p className="text-gray-400 mb-4">
                Comprehensive dashboard to manage mentors, track their performance over time, and identify trends in teaching quality.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Performance tracking</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Trend analysis</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Individual insights</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl p-8 hover:border-blue-500 transition-colors">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-6">
                <Award className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Visual Insights</h3>
              <p className="text-gray-400 mb-4">
                Interactive visualizations help you understand teaching flow, identify strengths, and pinpoint areas for improvement at a glance.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Flow visualizations</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Performance charts</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Actionable feedback</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <div className="bg-gradient-to-b from-black to-gray-900 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How MindTrace Works
            </h2>
            <p className="text-xl text-gray-400">
              Simple workflow, powerful results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Upload Video</h3>
              <p className="text-gray-400">
                Upload your teaching session video to the platform
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">AI Transcription</h3>
              <p className="text-gray-400">
                Automatic transcription with timestamp precision
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Smart Analysis</h3>
              <p className="text-gray-400">
                AI evaluates teaching quality across multiple metrics
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                4
              </div>
              <h3 className="text-xl font-bold mb-2">Get Insights</h3>
              <p className="text-gray-400">
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