import React from 'react';
import { Footer } from './modern-animated-footer';
import { Award, Linkedin, Github, Mail } from 'lucide-react';

const MindTraceFooter = () => {
  const socialLinks = [
    {
      icon: <Linkedin className="w-6 h-6" />,
      href: "https://www.linkedin.com/in/parth-gupta-4598b8324/",
      label: "LinkedIn",
    },
    {
      icon: <Github className="w-6 h-6" />,
      href: "https://github.com/ParthG2209/MindTrace",
      label: "GitHub",
    },
    {
      icon: <Mail className="w-6 h-6" />,
      href: "mailto:guptaparth2209@gmail.com",
      label: "Email",
    },
  ];

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Documentation", href: "#docs" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <Footer
      brandName="MindTrace"
      brandDescription="AI-powered mentor evaluation system for modern educators. Analyze teaching quality with explainable AI insights."
      socialLinks={socialLinks}
      navLinks={navLinks}
      creatorName="Parth Gupta"
      creatorUrl="https://www.linkedin.com/in/parth-gupta-4598b8324/"
      brandIcon={<Award className="w-8 sm:w-10 md:w-14 h-8 sm:h-10 md:h-14 text-background dark:text-foreground drop-shadow-lg" />}
    />
  );
};

export default MindTraceFooter;