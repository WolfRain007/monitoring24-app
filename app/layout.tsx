import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monitoring24",
  description: "Event-first intelligence and risk analytics platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-[#eef4fb] text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
