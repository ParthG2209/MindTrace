import React from 'react';
import { Footer } from './modern-animated-footer';
import { Linkedin, Github, Mail } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const MindTraceFooter = () => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  const socialLinks = [
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

  const navLinks = [];

  return (
    <Footer
      brandName="MindTrace"
      brandDescription=""
      socialLinks={socialLinks}
      navLinks={navLinks}
      creatorName="Team MindTrace"
      creatorUrl="https://www.linkedin.com/in/parth-gupta-4598b8324/"
      brandIcon={
        <img 
          src="/logo.png" 
          alt="MindTrace Logo" 
          className="w-full h-full object-cover rounded-xl drop-shadow-lg" 
        />
      }
    />
  );
};

export default MindTraceFooter;