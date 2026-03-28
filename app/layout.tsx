import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "CandEntry • AI Hiring Decision Engine",
  description: "AI-powered CV analysis and hiring decisions",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-9VW18879T2"
          strategy="afterInteractive"
        />
        <Script id="ga-script" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-9VW18879T2');
          `}
        </Script>

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

      <body className="min-h-screen bg-white text-slate-900 antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}