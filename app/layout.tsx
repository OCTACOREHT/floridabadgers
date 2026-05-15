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

const supabaseImageOrigin = (() => {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!rawUrl) return null;

  try {
    return new URL(rawUrl).origin;
  } catch {
    return null;
  }
})();

export const metadata: Metadata = {
  title: "Florida Badgers FCA - Football Club",
  description:
    "Florida Badgers FCA is one of the top football clubs in the USA. Based in Boynton Beach, FL.",
  icons: {
    icon: [
      { url: "/images/florida-badgers-icon.png?v=4", type: "image/png", sizes: "343x369" },
      { url: "/favicon.ico?v=4", type: "image/x-icon" },
    ],
    shortcut: "/images/florida-badgers-icon.png?v=4",
    apple: "/images/florida-badgers-icon.png?v=4",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(poppins.className, "font-sans", geist.variable, montserrat.variable)}>
      <head>
        {supabaseImageOrigin ? (
          <>
            <link rel="preconnect" href={supabaseImageOrigin} crossOrigin="" />
            <link rel="dns-prefetch" href={supabaseImageOrigin} />
          </>
        ) : null}
      </head>
      <body className="bg-slate-100 text-slate-900 antialiased overflow-x-hidden">
        <SiteTracker />
        <Navbar />
        <RouteRestoreBoundary>{children}</RouteRestoreBoundary>
        <GlobalFooter />
      </body>
    </html>
  );
}
