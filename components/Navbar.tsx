"use client";

import Image from "next/image";
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
      className={`rounded-lg px-4 py-2 text-sm transition ${
        active
          ? "border border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
          : "border border-transparent text-slate-300 hover:border-slate-600 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* LOGO ONLY */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="CandEntry"
            width={48}
            height={48}
            className="h-12 w-auto object-contain"
            priority
          />
        </Link>

        {/* NAV LINKS */}
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