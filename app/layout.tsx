import type { Metadata } from "next";
import { Poppins, Geist, Montserrat } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { GlobalFooter } from "@/components/GlobalFooter";
import { SiteTracker } from "@/components/SiteTracker";
import { RouteRestoreBoundary } from "@/components/RouteRestoreBoundary";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Florida Badgers FCA - Football Club",
  description:
    "Florida Badgers FCA is one of the top football clubs in the USA. Based in Boynton Beach, FL.",
  icons: {
    icon: "/favicon.ico?v=2",
    shortcut: "/favicon.ico?v=2",
    apple: "/images/florida-badgers-icon.png?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(poppins.className, "font-sans", geist.variable, montserrat.variable)}>
      <body className="bg-slate-100 text-slate-900 antialiased overflow-x-hidden">
        <SiteTracker />
        <Navbar />
        <RouteRestoreBoundary>{children}</RouteRestoreBoundary>
        <GlobalFooter />
      </body>
    </html>
  );
}
