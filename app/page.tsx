import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1 text-sm text-cyan-300">
          Candentry • AI Hiring Decision Engine
        </div>

        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
          Make hiring decisions faster, with sharper candidate insight.
        </h1>

        <p className="mt-6 max-w-2xl text-base text-slate-300 sm:text-lg">
          Upload a candidate CV and get an AI-powered evaluation with hire score,
          strengths, risks, growth potential, and a final recommendation.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/upload"
            className="rounded-xl bg-cyan-500 px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-400"
          >
            Upload CV
          </Link>

          <Link
            href="/result"
            className="rounded-xl border border-slate-700 px-6 py-3 font-medium text-white transition hover:border-slate-500 hover:bg-slate-900"
          >
            View Demo Result
          </Link>
        </div>
      </section>
    </main>
  );
}