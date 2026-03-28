"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function NavLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="CandEntry"
            width={56}
            height={56}
            className="h-12 w-auto rounded-xl object-contain shadow-sm sm:h-14"
            priority
          />
        </Link>

        <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-2 shadow-sm">
          <NavLink href="/upload" label="Upload" />
          <NavLink href="/bulk-upload" label="Bulk Upload" />
          <NavLink href="/dashboard" label="Dashboard" />
          <NavLink href="/compare" label="Compare" />
          <NavLink href="/compare-history" label="Compare History" />
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
        >
          Menu
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-3 md:hidden">
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
            <NavLink
              href="/upload"
              label="Upload"
              onClick={() => setMobileOpen(false)}
            />
            <NavLink
              href="/bulk-upload"
              label="Bulk Upload"
              onClick={() => setMobileOpen(false)}
            />
            <NavLink
              href="/dashboard"
              label="Dashboard"
              onClick={() => setMobileOpen(false)}
            />
            <NavLink
              href="/compare"
              label="Compare"
              onClick={() => setMobileOpen(false)}
            />
            <NavLink
              href="/compare-history"
              label="Compare History"
              onClick={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}
    </nav>
  );
}