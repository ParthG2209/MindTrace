
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Component } from "@/components/ui/animated-characters-login-page";

const DemoOne = () => {
  const navigate = useNavigate();

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Back button */}
      <button
        onClick={() => navigate("/")}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          color: "#374151",
          fontSize: "14px",
          fontWeight: "500",
          cursor: "pointer",
          transition: "all 0.2s",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#f9fafb";
          e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
          e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
        }}
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      {/* Login page component */}
      <Component />
    </div>
  );
};

export default DemoOne;
