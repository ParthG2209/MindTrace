import React from "react";
import { cn } from "../../lib/utils"; // Adjust path if necessary based on your folder structure

export const Footer = ({
  brandName = "MindTrace",
  brandDescription = "Explainable Mentor Evaluation System",
  socialLinks = [],
  navLinks = [],
  creatorName,
  creatorUrl,
  brandIcon,
  className,
}) => {
  return (
    <section className={cn("relative w-full mt-0 overflow-hidden", className)}>
      <footer className="relative transition-colors duration-300">
        <div className="max-w-7xl flex flex-col justify-between mx-auto min-h-[30rem] sm:min-h-[35rem] md:min-h-[40rem] relative p-4 py-10">
          
          {/* Main Content Content */}
          <div className="flex flex-col mb-12 sm:mb-20 md:mb-0 w-full z-20">
            <div className="w-full flex flex-col items-center">
              <div className="space-y-2 flex flex-col items-center flex-1">
                <div className="flex items-center gap-2">
                  {/* Forced text-white for visibility */}
                  <span className="text-white text-3xl font-bold transition-colors duration-300 tracking-wide">
                    {brandName}
                  </span>
                </div>
                <p className="text-gray-300 font-medium text-center w-full max-w-sm sm:w-96 px-4 sm:px-0 transition-colors duration-300">
                  {brandDescription}
                </p>
              </div>

              {/* Social Links */}
              {socialLinks.length > 0 && (
                <div className="flex mb-8 mt-6 gap-5">
                  {socialLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-all duration-300 transform hover:scale-110"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="w-6 h-6">
                        {link.icon}
                      </div>
                      <span className="sr-only">{link.label}</span>
                    </a>
                  ))}
                </div>
              )}

              {/* Navigation Links */}
              {navLinks.length > 0 && (
                <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-gray-300 max-w-full px-4 transition-colors duration-300">
                  {navLinks.map((link, index) => (
                    <a
                      key={index}
                      className="hover:text-white hover:underline underline-offset-4 decoration-blue-500 duration-300"
                      href={link.href}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Copyright & Creator */}
          <div className="mt-20 md:mt-24 flex flex-col gap-2 md:gap-1 items-center justify-center md:flex-row md:items-center md:justify-between px-4 md:px-0 z-20">
            <p className="text-sm text-gray-400 text-center md:text-left">
              © {new Date().getFullYear()} {brandName}. All rights reserved.
            </p>
            {creatorName && creatorUrl && (
              <nav className="flex gap-4">
                <a
                  href={creatorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-white transition-colors duration-300"
                >
                  Crafted by {creatorName}
                </a>
              </nav>
            )}
          </div>
        </div>
        
        {/* Large Background Text Effect */}
        <div 
          className="bg-gradient-to-b from-white/10 via-white/5 to-transparent bg-clip-text text-transparent leading-none absolute left-1/2 -translate-x-1/2 bottom-40 md:bottom-32 font-extrabold tracking-tighter pointer-events-none select-none text-center px-4 z-0"
          style={{
            fontSize: 'clamp(3rem, 12vw, 10rem)',
            maxWidth: '95vw'
          }}
        >
          {brandName.toUpperCase()}
        </div>

        {/* Floating Bottom Logo Box */}
        <div className="absolute bottom-24 md:bottom-20 left-1/2 -translate-x-1/2 z-10 drop-shadow-2xl">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-slate-800 to-black border border-slate-700 rounded-3xl flex items-center justify-center shadow-xl p-4">
            {/* Renders the passed icon/image */}
            {brandIcon}
          </div>
        </div>

      </footer>
    </section>
  );
};