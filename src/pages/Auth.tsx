// src/pages/Auth.tsx
import React, { useState } from "react";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 border border-purple-600/20 shadow-2xl rounded-2xl p-8 w-full max-w-sm">
        {/* לוגו + כותרת */}
        <div className="flex flex-col items-center mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-purple-400 mb-2"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2l2.39 6.96H21l-5.48 4 2.1 6.9L12 15.4 6.38 19.8l2.1-6.9L2 8.96h6.61L12 2z" />
          </svg>
          <h1 className="text-2xl font-bold">Deta</h1>
        </div>

        {/* לשוניות */}
        <div className="flex mb-6">
          <button
            onClick={() => setMode("signin")}
            className={`flex-1 py-2 rounded-l-lg transition ${
              mode === "signin"
                ? "bg-gradient-to-r from-purple-500 to-violet-500"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 rounded-r-lg transition ${
              mode === "signup"
                ? "bg-gradient-to-r from-purple-500 to-violet-500"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* טופס */}
        <form className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="••••••••"
            />
          </div>

          {mode === "signup" && (
            <div>
              <label
                htmlFor="confirm"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Confirm Password
              </label>
              <input
                id="confirm"
                type="password"
                required
                className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="••••••••"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-500 to-violet-500 text-white font-medium hover:from-purple-600 hover:to-violet-600 transition"
          >
            {mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-gray-400 text-center mt-4">
          {mode === "signin" ? (
            <>
              Don't have an account?{" "}
              <button
                onClick={() => setMode("signup")}
                className="text-purple-400 hover:text-purple-300"
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setMode("signin")}
                className="text-purple-400 hover:text-purple-300"
              >
                Sign In
              </button>
            </>
          )}
        </p>

        <p className="text-xs text-gray-500 text-center mt-6">
          Powered by LiskCell • LPT Engine
        </p>
      </div>
    </div>
  );
}
