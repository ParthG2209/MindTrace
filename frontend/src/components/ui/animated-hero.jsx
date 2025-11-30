import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MoveRight } from "lucide-react";

export const AnimatedHero = () => {
  const navigate = useNavigate();
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["intelligent", "powerful", "explainable", "innovative", "transformative"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="w-full bg-white dark:bg-black border-t border-gray-200 dark:border-white/20 transition-colors duration-300">
      <div className="container mx-auto">
        <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
          <div className="flex gap-4 flex-col">
            <h1 className="text-5xl md:text-7xl max-w-3xl tracking-tighter text-center font-regular text-gray-900 dark:text-white transition-colors duration-300">
              <span>Teaching evaluation is</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-semibold text-blue-600 dark:text-white transition-colors duration-300"
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>
            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-gray-600 dark:text-gray-300 max-w-2xl text-center px-4 transition-colors duration-300">
              Transform your teaching assessment with AI-powered insights. MindTrace provides detailed, explainable evaluations across multiple dimensions including clarity, structure, correctness, pacing, and communication. Get actionable feedback that helps educators improve their teaching quality.
            </p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center justify-center gap-4 h-11 rounded-md px-8 text-base font-semibold bg-blue-600 dark:bg-white text-white dark:text-black hover:bg-blue-700 dark:hover:bg-gray-200 transition-colors duration-300"
            >
              Get Started Free <MoveRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};