"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function NavLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={`rounded-lg border px-4 py-2 text-sm transition ${
        active
          ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
          : "border-transparent text-slate-300 hover:border-slate-600 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/upload" className="text-lg font-semibold text-white">
          Candentry
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <NavLink href="/upload" label="Upload" />
          <NavLink href="/bulk-upload" label="Bulk Upload" />
          <NavLink href="/dashboard" label="Dashboard" />
          <NavLink href="/compare" label="Compare" />
          <NavLink href="/compare-history" label="Compare History" />
        </div>
      </div>
    </nav>
  );
}