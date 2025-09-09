import React from "react";
import { AuthPage } from "./AuthPage";
import {
  FaInstagram,
  FaFacebookF,
  FaLinkedinIn,
  FaYoutube,
} from "react-icons/fa";

// Simple Card Icon Component
const CardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none">
    <rect x="4" y="8" width="24" height="16" rx="4" fill="url(#grad)" />
    <rect x="7" y="14" width="10" height="2" rx="1" fill="#fff" />
    <rect x="7" y="18" width="6" height="2" rx="1" fill="#fff" />
    <circle cx="23" cy="20" r="2" fill="#fff" />
    <defs>
      <linearGradient
        id="grad"
        x1="4"
        y1="8"
        x2="28"
        y2="24"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#3b82f6" />
        <stop offset="1" stopColor="#10b981" />
      </linearGradient>
    </defs>
  </svg>
);

const HomePage = () => (
  <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-r from-blue-100 via-white to-purple-100 relative px-8 md:px-0 py-[25%] md:py-0">
    {/* Background decoration */}
    <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
    <div className="absolute top-20 right-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
    <div className="absolute bottom-10 left-1 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
    <div className="absolute top-10 center w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>

    {/* Company Branding - Bottom Center */}
    <div className="absolute bottom-6 left-[50%] transform -translate-x-1/2 flex items-center gap-2 z-20">
      <img
        src="https://review.sccinfotech.com/scc.png"
        alt="SCC Infotech LLP Logo"
        className="w-14 h-14 md:w-16 md:h-16 object-contain"
      />
      <div>
        <div className="flex items-center gap-1 text-lg">
          <span className="text-gray-500 font-normal md:text-xl text-base">
            AI
          </span>
          <span className="text-yellow-500 md:text-xl text-base">✨</span>
          <span
            className="md:text-semibold text-lg text-purple-500 "
            style={{ letterSpacing: 1 }}
          >
            Powered
          </span>
        </div>
        <div className="text-sm md:text-xl font-bold tracking-wide leading-tight bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
          SCC INFOTECH LLP
        </div>
      </div>
    </div>

    <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-7xl gap-8 md:gap-12 relative z-10">
      {/* Left Column - Visual */}
      <div className="relative flex-1 flex items-center justify-center w-full md:w-auto">
        <div className="relative w-full max-w-sm md:max-w-lg bg-white rounded-3xl shadow-2xl p-3 md:p-5 transform -rotate- hover:rotate-0 transition-transform duration-500">
          <div className="absolute -top-3 -left-4 md:-left-8 bg-yellow-400 text-yellow-900 px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-semibold shadow-md animate-bounce z-10">
            🚀 Stand Out Online
          </div>
          <div className="absolute -top-5 -right-4 md:-right-5 bg-green-500 text-white px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-semibold shadow-md z-10">
            Digital Card ✨
          </div>
          {/* Header */}
          <div className="text-base md:text-xl font-bold text-center text-blue-700 mb-2 md:mb-5 tracking-wide">
            Digital Business Cards
          </div>
          {/* Mock Digital Business Card */}
          <div className="bg-gray-50 rounded-xl p-4 md:p-8 shadow-inner">
            {/* <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                <CardIcon className="w-8 h-8" />
              </div>
              <div className="ml-3">
                <h3 className="font-semibold text-gray-900">Digital Business Card</h3>
                <p className="text-sm text-gray-500">Share your professional identity</p>
              </div>
            </div> */}
            <div className="bg-white rounded-lg p-3 md:p-4 mb-4 border-l-4 border-blue-500 shadow relative">
              {/* Social Media Icons - Top Right */}
              <div className="absolute top-2 md:top-2 -right-3 md:-right-5 flex flex-col md:flex-col gap-1 z-10">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center rounded-full bg-gradient-to-tr from-pink-500 to-yellow-400 text-white hover:scale-110 transition-transform shadow"
                >
                  <FaInstagram size={window.innerWidth < 768 ? 16 : 18} />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center rounded-full bg-blue-600 text-white hover:scale-110 transition-transform shadow"
                >
                  <FaFacebookF size={window.innerWidth < 768 ? 16 : 18} />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center rounded-full bg-blue-700 text-white hover:scale-110 transition-transform shadow"
                >
                  <FaLinkedinIn size={window.innerWidth < 768 ? 16 : 18} />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center rounded-full bg-red-600 text-white hover:scale-110 transition-transform shadow"
                >
                  <FaYoutube size={window.innerWidth < 768 ? 16 : 18} />
                </a>
              </div>
              <div className="flex flex-col sm:flex-row">
                {/* Left: Profile and Info */}
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <img
                      // src="https://randomuser.me/api/portraits/men/32.jpg"
                      src="https://review.sccinfotech.com/scc.png"
                      alt="Profile"
                      className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-blue-400 mr-2 md:mr-3"
                    />
                    <div>
                      <div className="font-bold text-base md:text-lg text-gray-900">
                        SCC Infotech LLP
                      </div>
                      <div className="text-xs md:text-sm text-gray-500">
                        Software company
                      </div>
                      <div className="text-xs text-gray-400">IT & Services</div>
                    </div>
                  </div>
                  <div className="text-xs md:text-sm text-gray-700 mb-1">
                    <span className="font-semibold">Email:</span>{" "}
                    sccinfotech@gmail.com
                  </div>
                  <div className="text-xs md:text-sm text-gray-700 mb-1">
                    <span className="font-semibold">Phone:</span> +91 11223
                    45678
                  </div>
                  <div className="text-xs md:text-sm text-gray-700">
                    <span className="font-semibold">Website:</span>{" "}
                    https://sccinfotech.com
                  </div>
                </div>
              </div>
            </div>
            <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 md:py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow text-sm md:text-base">
              📇 Share My Card
            </button>
          </div>
          <div className="absolute -bottom-5 -right-4 md:-right-5 bg-purple-500 text-white px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-semibold shadow-md animate-pulse z-10">
            🌟 Make Connections
          </div>
        </div>
      </div>

      {/* Right Column - AuthPage */}
      <div className="flex-1 flex items-center justify-center w-full md:w-auto">
        <div className="w-full max-w-sm md:max-w-md">
          <AuthPage />
        </div>
      </div>
    </div>
  </div>
);

export default HomePage;
