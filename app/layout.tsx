import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Florida Badgers FCA - Football Club",
  description:
    "Florida Badgers FCA is one of the top football clubs in the USA. Based in Boynton Beach, FL.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body
        className="antialiased"
        style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
