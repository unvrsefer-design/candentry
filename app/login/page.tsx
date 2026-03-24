"use client";

import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      window.location.href = "/";
    } else {
      alert("Invalid credentials");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur">
        
        {/* HEADER */}
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-widest text-cyan-400">
            Secure Login
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            Access Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Enter your credentials to continue.
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          <div>
            <label className="mb-1 block text-sm text-slate-300">
              Username
            </label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            className="mt-4 w-full rounded-xl bg-cyan-500 py-3 text-sm font-semibold text-black transition hover:bg-cyan-400"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}