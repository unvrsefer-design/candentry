import "./globals.css";
import Navbar from "../components/Navbar";

export const metadata = {
  title: "Candentry",
  description: "AI-powered candidate evaluation",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white">
        <Navbar />
        <div className="pt-4">{children}</div>
      </body>
    </html>
  );
}