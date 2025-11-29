import React, { useState, useEffect, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Checkbox } from "./checkbox";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../lib/firebase";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [bluePos, setBluePos] = useState({ pupilX: 0, pupilY: 0, bodySkew: 0 });
  const [purplePos, setPurplePos] = useState({ pupilX: 0, pupilY: 0, bodySkew: 0 });

  const formRef = useRef(null);
  const passwordInputRef = useRef(null);
  const emailInputRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (formRef.current) {
        const rect = formRef.current.getBoundingClientRect();
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    if (!formRef.current) return;

    const formRect = formRef.current.getBoundingClientRect();
    const formCenterX = formRect.width / 2;
    const formCenterY = formRect.height / 2;

    const deltaX = mousePos.x - formCenterX;
    const deltaY = mousePos.y - formCenterY;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = Math.sqrt(formCenterX * formCenterX + formCenterY * formCenterY);
    const normalizedDistance = Math.min(distance / maxDistance, 1);

    const maxPupilOffset = 8;
    const pupilX = (deltaX / maxDistance) * maxPupilOffset * normalizedDistance;
    const pupilY = (deltaY / maxDistance) * maxPupilOffset * normalizedDistance;

    const maxBodySkew = 5;
    const bodySkew = (deltaX / maxDistance) * maxBodySkew;

    setBluePos({ pupilX, pupilY, bodySkew });
    setPurplePos({ pupilX, pupilY, bodySkew });
  }, [mousePos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login success:", userCredential.user);
      alert("Login successful!");
    } catch (err) {
      setError("Invalid email or password. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google sign-in success:", result.user);
      alert("Google sign-in successful!");
    } catch (err) {
      setError("Google sign-in failed. Please try again.");
      console.error("Google sign-in error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const Character = ({ color, position }) => {
    const eyeColor = color === "blue" ? "#60a5fa" : "#a78bfa";
    const bodyColor = color === "blue" ? "#3b82f6" : "#8b5cf6";
    const pupilColor = "#1e293b";

    const bodyTransform =
      password.length > 0 && showPassword
        ? "skewX(0deg)"
        : isTyping || (password.length > 0 && !showPassword)
        ? `skewX(${position.bodySkew - 12}deg) translateX(40px)`
        : `skewX(${position.bodySkew}deg)`;

    const handStyle =
      password.length > 0 && !showPassword
        ? {
            transform: "translateX(0px) translateY(0px)",
            opacity: 1,
          }
        : {
            transform: "translateX(-50px) translateY(20px)",
            opacity: 0,
          };

    return (
      <div
        style={{
          position: "relative",
          width: "120px",
          height: "160px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          transition: "all 0.3s ease-out",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "100px",
            backgroundColor: bodyColor,
            borderRadius: "40px 40px 20px 20px",
            position: "relative",
            transform: bodyTransform,
            transition: "transform 0.3s ease-out",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "30px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "16px",
            }}
          >
            {[0, 1].map((i) => (
              <div
                key={i}
                style={{
                  width: "24px",
                  height: "24px",
                  backgroundColor: "#ffffff",
                  borderRadius: "50%",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    backgroundColor: eyeColor,
                    borderRadius: "50%",
                    position: "absolute",
                    top: "4px",
                    left: "4px",
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      backgroundColor: pupilColor,
                      borderRadius: "50%",
                      position: "absolute",
                      top: "4px",
                      left: "4px",
                      transform: `translate(${position.pupilX}px, ${position.pupilY}px)`,
                      transition: "transform 0.1s ease-out",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "8px",
              ...handStyle,
              transition: "all 0.3s ease-out",
            }}
          >
            {[0, 1].map((i) => (
              <div
                key={i}
                style={{
                  width: "28px",
                  height: "32px",
                  backgroundColor: bodyColor,
                  borderRadius: "14px",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      <div
        ref={formRef}
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          padding: "32px",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "40px",
            marginBottom: "32px",
          }}
        >
          <Character color="blue" position={bluePos} />
          <Character color="purple" position={purplePos} />
        </div>

        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: "8px",
            }}
          >
            Welcome back
          </h1>
          <p style={{ color: "#6b7280" }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              ref={emailInputRef}
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setIsTyping(false)}
              onBlur={() => setIsTyping(false)}
              required
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Label htmlFor="password">Password</Label>
            <div style={{ position: "relative" }}>
              <Input
                id="password"
                ref={passwordInputRef}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                required
                style={{ paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6b7280",
                  padding: "0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Checkbox id="remember" checked={rememberMe} onCheckedChange={setRememberMe} />
              <Label
                htmlFor="remember"
                style={{
                  fontSize: "14px",
                  color: "#4b5563",
                  cursor: "pointer",
                }}
              >
                Remember me
              </Label>
            </div>
            <button
              type="button"
              onClick={() => alert('Forgot password functionality')}
              style={{
                fontSize: "14px",
                color: "#8b5cf6",
                textDecoration: "none",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Forgot password?
            </button>
          </div>

          {error && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "#fee2e2",
                border: "1px solid #fca5a5",
                borderRadius: "8px",
                color: "#991b1b",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          <Button type="submit" disabled={isLoading} style={{ width: "100%" }}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>

          <div style={{ position: "relative", textAlign: "center" }}>
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "0",
                right: "0",
                height: "1px",
                backgroundColor: "#e5e7eb",
              }}
            />
            <span
              style={{
                position: "relative",
                backgroundColor: "#ffffff",
                padding: "0 16px",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              Or continue with
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
              />
              <path
                fill="#34A853"
                d="M9.003 18c2.43 0 4.467-.806 5.956-2.183l-2.909-2.259c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
              />
              <path
                fill="#EA4335"
                d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z"
              />
            </svg>
            Log in with Google
          </Button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "24px",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => alert('Sign up functionality')}
            style={{
              color: "#8b5cf6",
              textDecoration: "none",
              fontWeight: "500",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;