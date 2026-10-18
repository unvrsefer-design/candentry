import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

const features = [
  {
    title: "Candidate Analysis",
    description: "AI-powered CV evaluation and candidate insights.",
    href: "/upload",
    label: "Open Upload",
  },
  {
    title: "Bulk Screening",
    description: "Analyze multiple candidates in one workflow.",
    href: "/bulk-upload",
    label: "Open Bulk",
  },
  {
    title: "Candidate Dashboard",
    description: "Manage candidates, shortlists and hiring decisions.",
    href: "/dashboard",
    label: "Open Dashboard",
  },
  {
    title: "Candidate Comparison",
    description: "Compare candidates and review hiring recommendations.",
    href: "/compare",
    label: "Open Compare",
  },
];

export default async function AdminPage() {
  const cookieStore = await cookies();

  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const user = await verifySessionToken(token);

  if (!user) {
    redirect("/login?next=/admin");
  }

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  const accounts = [
    {
      name: "Administrator",
      username: process.env.CANDENTRY_ADMIN_USERNAME || "admin",
      role: "Admin",
      access: "Full workspace access",
    },
    {
      name: "Recruiter",
      username: process.env.CANDENTRY_RECRUITER_USERNAME || "recruiter",
      role: "Recruiter",
      access: "Recruitment tools",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[32px] bg-slate-950 px-7 py-10 text-white sm:px-10">
          <div className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
            Administration
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            Admin Console
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Manage your CandEntry workspace and explore the
            role-based recruitment platform.
          </p>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Demo workspace active
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Demo Accounts", value: "2" },
            { label: "Access Roles", value: "2" },
            { label: "AI Providers", value: "2" },
            { label: "Workspace", value: "Active" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-500">
                {item.label}
              </p>

              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-6">
            <h2 className="text-xl font-semibold text-slate-950">
              Workspace Users
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Two predefined accounts for the CandEntry product demonstration.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Access</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {accounts.map((account) => (
                  <tr key={account.role}>
                    <td className="px-6 py-5 font-semibold text-slate-900">
                      {account.name}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-600">
                      {account.username}
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          account.role === "Admin"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-violet-50 text-violet-700"
                        }`}
                      >
                        {account.role}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-600">
                      {account.access}
                    </td>

                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold text-slate-950">
              Workspace Modules
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Explore the core CandEntry recruitment workflows.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-slate-950">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {feature.description}
                </p>

                <a
                  href={feature.href}
                  className="mt-5 inline-flex rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  {feature.label} →
                </a>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-10 text-center text-xs text-slate-400">
          CandEntry • Role-Based Access Demonstration
        </p>
      </div>
    </main>
  );
}