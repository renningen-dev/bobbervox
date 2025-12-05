import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import * as firebaseui from "firebaseui";
import "firebaseui/dist/firebaseui.css";
import { auth } from "../lib/firebase";
import { useAuthStore } from "../stores/authStore";
import { useThemeStore } from "../stores/themeStore";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const uiRef = useRef<HTMLDivElement>(null);
  const uiInstanceRef = useRef<firebaseui.auth.AuthUI | null>(null);

  useEffect(() => {
    // Redirect if already authenticated
    if (!isLoading && isAuthenticated) {
      navigate("/projects", { replace: true });
      return;
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (!uiRef.current || isLoading) return;

    // Initialize FirebaseUI
    if (!uiInstanceRef.current) {
      uiInstanceRef.current =
        firebaseui.auth.AuthUI.getInstance() ||
        new firebaseui.auth.AuthUI(auth);
    }

    const uiConfig: firebaseui.auth.Config = {
      signInSuccessUrl: "/projects",
      signInOptions: [
        GoogleAuthProvider.PROVIDER_ID,
        GithubAuthProvider.PROVIDER_ID,
      ],
      signInFlow: "popup",
      callbacks: {
        signInSuccessWithAuthResult: () => {
          // Return false to prevent redirect, let AuthProvider handle it
          navigate("/projects", { replace: true });
          return false;
        },
      },
    };

    uiInstanceRef.current.start(uiRef.current, uiConfig);

    return () => {
      if (uiInstanceRef.current) {
        uiInstanceRef.current.reset();
      }
    };
  }, [navigate, isLoading]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 relative">
        {/* Gradient background */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-100 via-gray-50 to-purple-100 dark:from-indigo-950/20 dark:via-gray-900 dark:to-purple-950/20 pointer-events-none" />
        <div className="relative z-10 h-8 w-8 animate-spin rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 relative transition-colors">
      {/* Gradient background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-100 via-gray-50 to-purple-100 dark:from-indigo-950/20 dark:via-gray-900 dark:to-purple-950/20 pointer-events-none" />

      {/* Theme toggle */}
      <button
        onClick={toggle}
        className="absolute top-4 right-4 z-20 p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5 transition-all backdrop-blur-xl border border-white/50 dark:border-white/10"
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
      </button>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo and title */}
        <div className="mb-8 text-center">
          <img
            src="/logo.png"
            alt="Bobber VOX"
            className="mx-auto mb-4 h-20 w-20"
          />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bobber VOX</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Video dubbing made simple</p>
        </div>

        {/* Auth card - glassy design */}
        <div className="rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-none p-8">
          <h2 className="mb-6 text-center text-xl font-semibold text-gray-900 dark:text-white">
            Sign in to continue
          </h2>

          {/* FirebaseUI container */}
          <div ref={uiRef} className="firebase-ui-container" />
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-500">
          By signing in, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  );
}
