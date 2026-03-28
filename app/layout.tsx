import "./globals.css";
import Navbar from "../components/Navbar";

export const metadata = {
  title: "CandEntry",
  description: "AI-powered hiring platform",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900">
        <Navbar />
        <div className="pt-4">{children}</div>
      </body>
    </html>
  );
}