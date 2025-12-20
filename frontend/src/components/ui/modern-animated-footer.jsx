import React from "react";
import { Award } from "lucide-react";
import { cn } from "../../lib/utils";

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
      <footer className="bg-transparent mt-20 relative transition-colors duration-300">
        <div className="max-w-7xl flex flex-col justify-between mx-auto min-h-[20rem] sm:min-h-[22rem] md:min-h-[25rem] relative p-4 py-10">
          
          {/* Main Content */}
          <div className="flex flex-col mb-8 sm:mb-12 md:mb-0 w-full">
            <div className="w-full flex flex-col items-center">
              <div className="space-y-2 flex flex-col items-center flex-1">
                <div className="flex items-center gap-2">
                </div>
                <p className="text-gray-300 font-semibold text-center w-full max-w-sm sm:w-96 px-4 sm:px-0 transition-colors duration-300 text-sm">
                  {brandDescription}
                </p>
              </div>

              {/* Social Links */}
              {socialLinks.length > 0 && (
                <div className="flex mb-6 mt-3 gap-4">
                  {socialLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors duration-300"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="w-5 h-5 hover:scale-110 duration-300">
                        {link.icon}
                      </div>
                      <span className="sr-only">{link.label}</span>
                    </a>
                  ))}
                </div>
              )}

              {/* Navigation Links */}
              {navLinks.length > 0 && (
                <div className="flex flex-wrap justify-center gap-4 text-xs font-medium text-gray-400 max-w-full px-4 transition-colors duration-300">
                  {navLinks.map((link, index) => (
                    <a
                      key={index}
                      className="hover:text-white duration-300 hover:font-semibold"
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
          <div className="mt-12 md:mt-16 flex flex-col gap-2 md:gap-1 items-center justify-center md:flex-row md:items-center md:justify-between px-4 md:px-0">
            <p className="text-sm text-gray-400 text-center md:text-left transition-colors duration-300">
              ©{new Date().getFullYear()} {brandName}. All rights reserved.
            </p>
            {creatorName && creatorUrl && (
              <nav className="flex gap-4">
                <a
                  href={creatorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-white transition-colors duration-300 hover:font-medium"
                >
                  Crafted by {creatorName}
                </a>
              </nav>
            )}
          </div>
        </div>
        
        <div 
          className="bg-gradient-to-b from-white/20 via-white/10 to-transparent bg-clip-text text-transparent leading-none absolute left-1/2 -translate-x-1/2 bottom-32 md:bottom-28 font-extrabold tracking-tighter pointer-events-none select-none text-center px-4 transition-colors duration-300"
          style={{
            fontSize: 'clamp(3rem, 12vw, 10rem)',
            maxWidth: '95vw'
          }}
        >
          {brandName.toUpperCase()}
        </div>

        {/* Bottom logo - Reduced size */}
        <div className="absolute hover:border-white duration-400 drop-shadow-[0_0px_20px_rgba(255,255,255,0.3)] bottom-16 md:bottom-14 backdrop-blur-sm rounded-2xl bg-black/60 left-1/2 border-2 border-white/20 flex items-center justify-center p-2 -translate-x-1/2 z-[0] transition-colors duration-300">
          <div className="w-10 sm:w-12 md:w-16 h-10 sm:h-12 md:h-16 bg-gradient-to-br from-white to-white/80 rounded-xl flex items-center justify-center shadow-lg transition-colors duration-300">
            {brandIcon || (
              <Award className="w-6 sm:w-8 md:w-10 h-6 sm:h-8 md:h-10 text-black drop-shadow-lg transition-colors duration-300" />
            )}
          </div>
        </div>

      </footer>
    </section>
  );
};