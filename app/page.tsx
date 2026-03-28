import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white px-6 py-20 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
        <div className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
          CandEntry • AI Hiring Decision Engine
        </div>

        <h1 className="mt-8 max-w-5xl text-5xl font-semibold tracking-tight text-slate-900 sm:text-7xl">
          Make hiring decisions faster, with sharper candidate insight.
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
          Upload a candidate CV and get an AI-powered evaluation with hire
          score, strengths, risks, growth potential, and a final
          recommendation.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/upload"
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
          >
            Upload CV
          </Link>

          <Link
            href="/report"
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            View Demo Result
          </Link>
        </div>
      </div>
    </main>
  );
}