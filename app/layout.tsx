import "./globals.css";
import Header from "@/components/Header";

export const metadata = {
  title: "Monitoring24",
  description: "Платформа мониторинга новостей и событий",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
