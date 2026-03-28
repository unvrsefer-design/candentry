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
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="CandEntry"
            width={56}
            height={56}
            className="h-14 w-auto rounded-xl object-contain shadow-sm"
            priority
          />
        </Link>

        <div className="flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-2 shadow-sm">
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