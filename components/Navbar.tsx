"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type UserRole = "admin" | "recruiter";

type AuthUser = {
  username: string;
  name: string;
  role: UserRole;
};

const navItems = [
  { href: "/upload", label: "Upload" },
  { href: "/bulk-upload", label: "Bulk" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/compare", label: "Compare" },
  { href: "/compare-history", label: "History" },
];

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

  const active =
    pathname === href ||
    (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const hideNavbar = pathname === "/login";

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (hideNavbar) {
      setAuthLoaded(true);
      return;
    }

    let cancelled = false;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          if (!cancelled) {
            setUser(null);
          }

          return;
        }

        const result = await response.json();

        if (!cancelled) {
          setUser(result.user || null);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setAuthLoaded(true);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [pathname, hideNavbar]);

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await fetch("/api/logout", {
        method: "POST",
      });

      setUser(null);
      router.replace("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
      setMobileOpen(false);
    }
  }

  if (hideNavbar) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0">
          <Image
            src="/logo.png"
            alt="CandEntry"
            width={132}
            height={44}
            className="h-10 w-auto rounded-xl object-contain"
            priority
          />
        </Link>

        {user && (
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
              />
            ))}

            {user.role === "admin" && (
              <NavLink href="/admin" label="Admin" />
            )}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-3">
          {authLoaded && user ? (
            <>
              <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  {user.role === "admin" ? "A" : "R"}
                </div>

                <div className="leading-tight">
                  <p className="text-sm font-semibold text-slate-900">
                    {user.name}
                  </p>

                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    {user.role}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="hidden rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 disabled:opacity-50 md:inline-flex"
              >
                {loggingOut ? "Signing out..." : "Sign out"}
              </button>

              <button
                type="button"
                onClick={() => setMobileOpen((current) => !current)}
                className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
                aria-label="Toggle navigation"
                aria-expanded={mobileOpen}
              >
                Menu
              </button>
            </>
          ) : authLoaded ? (
            <Link
              href="/login"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Sign in
            </Link>
          ) : (
            <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-100" />
          )}
        </div>
      </div>

      {mobileOpen && user && (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-3 lg:hidden">
          <div className="mx-auto max-w-7xl rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-3 border-b border-slate-200 px-2 pb-3">
              <p className="text-sm font-semibold text-slate-900">
                {user.name}
              </p>

              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                {user.role}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  onClick={() => setMobileOpen(false)}
                />
              ))}

              {user.role === "admin" && (
                <NavLink
                  href="/admin"
                  label="Admin"
                  onClick={() => setMobileOpen(false)}
                />
              )}

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="mt-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-medium text-slate-700"
              >
                {loggingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}