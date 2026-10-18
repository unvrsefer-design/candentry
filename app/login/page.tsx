"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FormEvent,
  Suspense,
  useMemo,
  useState,
} from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = useMemo(() => {
    const requested = searchParams.get("next");

    if (requested && requested.startsWith("/")) {
      return requested;
    }

    return "/dashboard";
  }, [searchParams]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Unable to sign in.");
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative">
            <Image
              src="/logo.png"
              alt="CandEntry"
              width={150}
              height={50}
              className="h-auto w-[150px] object-contain"
              priority
            />

            <div className="mt-16">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                AI Hiring Decision Engine
              </span>

              <h1 className="mt-7 max-w-lg text-5xl font-semibold leading-[1.08] tracking-tight">
                Better hiring decisions start with better insight.
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
                Analyze candidates, compare talent and manage hiring decisions
                from one intelligent workspace.
              </p>
            </div>
          </div>

          <div className="relative border-t border-white/10 pt-6 text-sm text-slate-400">
            CandEntry Workspace • Secure access
          </div>
        </section>

        <section className="flex items-center px-6 py-12 sm:px-12 lg:px-16">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <Image
                src="/logo.png"
                alt="CandEntry"
                width={140}
                height={46}
                className="h-auto w-[140px] object-contain"
                priority
              />
            </div>

            <div>
              <div className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                Secure Workspace
              </div>

              <h2 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950">
                Welcome back
              </h2>

              <p className="mt-3 text-base leading-7 text-slate-500">
                Sign in to your CandEntry hiring workspace.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-9 space-y-5">
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Username
                </label>

                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter your username"
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-blue-600 px-5 py-3.5 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="mt-8 border-t border-slate-200 pt-6">
              <p className="text-center text-xs leading-5 text-slate-400">
                Authorized access only • CandEntry AI Hiring Decision Engine
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-500">Loading workspace...</p>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}