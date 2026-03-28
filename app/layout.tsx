import "./globals.css";
import Script from "next/script";
import Link from "next/link";

export const metadata = {
  title: "CandEntry • AI Hiring Decision Engine",
  description: "AI-powered CV analysis and hiring decisions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* ✅ GOOGLE ANALYTICS */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-9VW18879T2"
          strategy="afterInteractive"
        />
        <Script id="ga-script" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-9VW18879T2');
          `}
        </Script>

        {/* ✅ MICROSOFT CLARITY */}
        <Script id="clarity-script" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "w2xw8qi1d4");
          `}
        </Script>
      </head>

      <body className="bg-white text-slate-900">
        {/* ✅ NAVBAR */}
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            
            {/* LOGO */}
            <Link href="/" className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-900 px-3 py-2 shadow">
                <img
                  src="/logo.png"
                  alt="CandEntry"
                  className="h-6 w-auto"
                />
              </div>
              <span className="hidden text-sm font-semibold sm:block">
                CandEntry
              </span>
            </Link>

            {/* DESKTOP MENU */}
            <nav className="hidden items-center gap-6 text-sm sm:flex">
              <Link href="/upload" className="hover:text-blue-600">
                Upload
              </Link>
              <Link href="/bulk-upload" className="hover:text-blue-600">
                Bulk
              </Link>
              <Link href="/dashboard" className="hover:text-blue-600">
                Dashboard
              </Link>
              <Link href="/compare-history" className="hover:text-blue-600">
                History
              </Link>
            </nav>

            {/* MOBILE MENU BUTTON */}
            <details className="relative sm:hidden">
              <summary className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2 text-sm">
                Menu
              </summary>

              <div className="absolute right-0 mt-3 w-52 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
                <div className="flex flex-col gap-3 text-sm">
                  <Link href="/upload">Upload</Link>
                  <Link href="/bulk-upload">Bulk Upload</Link>
                  <Link href="/dashboard">Dashboard</Link>
                  <Link href="/compare">Compare</Link>
                  <Link href="/compare-history">Compare History</Link>
                </div>
              </div>
            </details>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main>{children}</main>
      </body>
    </html>
  );
}