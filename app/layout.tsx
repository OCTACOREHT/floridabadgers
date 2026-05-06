import type { Metadata } from "next";
import { Poppins, Geist } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { SiteTracker } from "@/components/SiteTracker";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
    <html lang="en" className={cn(poppins.className, "font-sans", geist.variable)}>
      <body className="bg-slate-100 text-slate-900 antialiased">
        <SiteTracker />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
