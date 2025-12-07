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
      {/* Removed border-t and border colors to eliminate the top line */}
      <footer className="bg-transparent mt-20 relative transition-colors duration-300">
        <div className="max-w-7xl flex flex-col justify-between mx-auto min-h-[30rem] sm:min-h-[35rem] md:min-h-[40rem] relative p-4 py-10">
          <div className="flex flex-col mb-12 sm:mb-20 md:mb-0 w-full">
            <div className="w-full flex flex-col items-center">
              <div className="space-y-2 flex flex-col items-center flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-foreground dark:text-white text-3xl font-bold transition-colors duration-300">
                    {brandName}
                  </span>
                </div>
                <p className="text-muted-foreground dark:text-gray-300 font-semibold text-center w-full max-w-sm sm:w-96 px-4 sm:px-0 transition-colors duration-300">
                  {brandDescription}
                </p>
              </div>
              {socialLinks.length > 0 && (
                <div className="flex mb-8 mt-3 gap-4">
                  {socialLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.href}
                      className="text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white transition-colors duration-300"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="w-6 h-6 hover:scale-110 duration-300">
                        {link.icon}
                      </div>
                      <span className="sr-only">{link.label}</span>
                    </a>
                  ))}
                </div>
              )}
              {navLinks.length > 0 && (
                <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-muted-foreground dark:text-gray-400 max-w-full px-4 transition-colors duration-300">
                  {navLinks.map((link, index) => (
                    <a
                      key={index}
                      className="hover:text-foreground dark:hover:text-white duration-300 hover:font-semibold"
                      href={link.href}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="mt-20 md:mt-24 flex flex-col gap-2 md:gap-1 items-center justify-center md:flex-row md:items-center md:justify-between px-4 md:px-0">
            <p className="text-base text-muted-foreground dark:text-gray-400 text-center md:text-left transition-colors duration-300">
              ©{new Date().getFullYear()} {brandName}. All rights reserved.
            </p>
            {creatorName && creatorUrl && (
              <nav className="flex gap-4">
                <a
                  href={creatorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white transition-colors duration-300 hover:font-medium"
                >
                  Crafted by {creatorName}
                </a>
              </nav>
            )}
          </div>
        </div>
        
        {/* Large background text */}
        <div 
          className="bg-gradient-to-b from-foreground/20 dark:from-white/20 via-foreground/10 dark:via-white/10 to-transparent bg-clip-text text-transparent leading-none absolute left-1/2 -translate-x-1/2 bottom-40 md:bottom-32 font-extrabold tracking-tighter pointer-events-none select-none text-center px-4 transition-colors duration-300"
          style={{
            fontSize: 'clamp(3rem, 12vw, 10rem)',
            maxWidth: '95vw'
          }}
        >
          {brandName.toUpperCase()}
        </div>

        {/* Bottom logo */}
        <div className="absolute hover:border-foreground dark:hover:border-white duration-400 drop-shadow-[0_0px_20px_rgba(0,0,0,0.5)] dark:drop-shadow-[0_0px_20px_rgba(255,255,255,0.3)] bottom-24 md:bottom-20 backdrop-blur-sm rounded-3xl bg-background/60 dark:bg-black/60 left-1/2 border-2 border-border dark:border-white/20 flex items-center justify-center p-3 -translate-x-1/2 z-10 transition-colors duration-300">
          <div className="w-12 sm:w-16 md:w-24 h-12 sm:h-16 md:h-24 bg-gradient-to-br from-foreground dark:from-white to-foreground/80 dark:to-white/80 rounded-2xl flex items-center justify-center shadow-lg transition-colors duration-300">
            {brandIcon || (
              <Award className="w-8 sm:w-10 md:w-14 h-8 sm:h-10 md:h-14 text-background dark:text-black drop-shadow-lg transition-colors duration-300" />
            )}
          </div>
        </div>

        {/* Removed the bottom decorative line div entirely */}
      </footer>
    </section>
  );
};