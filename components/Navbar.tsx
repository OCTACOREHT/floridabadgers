"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Montserrat, Oswald } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const clubWordmark = Oswald({
  subsets: ["latin"],
  weight: ["500", "700"],
});

type NavSubItem = {
  label: string;
  href: string;
};

type NavItem = {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
  children?: NavSubItem[];
};

const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Men's First Team", href: "/first-team" },
  {
    label: "Academy",
    href: "/academy",
    children: [
      { label: "Juniors", href: "/academy/juniors" },
      { label: "About Club", href: "/academy/about" },
    ],
  },
  { label: "Match Schedule", href: "/schedule" },
  { label: "News", href: "/news" },
  { label: "Contact", href: "/contacts", variant: "secondary" },
  { label: "Register", href: "/join", variant: "primary" },
];

export function Navbar() {
  const pathname = usePathname();
  const isDashboardRoute = pathname?.startsWith("/dashboard");
  const isAuthRoute = pathname?.startsWith("/admin") || pathname?.startsWith("/login");
  const shouldHideNavbar = isDashboardRoute || isAuthRoute;
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAcademyOpen, setMobileAcademyOpen] = useState(false);

  useEffect(() => {
    if (shouldHideNavbar) {
      return;
    }

    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [pathname, shouldHideNavbar]);

  if (shouldHideNavbar) {
    return null;
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileAcademyOpen(false);
  };

  return (
    <div className={montserrat.className}>
      <header
        className={`hidden xl:block fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? "bg-[#FFFFFF] shadow-md h-16" 
            : "bg-transparent h-20"
        }`}
      >
        <div className="max-w-[1280px] mx-auto flex items-center h-16 px-4 xl:px-8 gap-4">
          <div className="relative z-20">
            <Link
              href="/"
              className="relative flex items-center justify-center w-16 h-16 translate-y-1"
            >
              <Image
                src="/images/Florida Badgers.png"
                alt="Florida Badgers FCA Logo"
                fill
                className="object-contain"
                priority
              />
            </Link>
          </div>

          <nav className="flex-1 flex items-center justify-center gap-2 xl:gap-3">
            {navItems.map((item) => {
              if (item.children?.length) {
                return (
                  <div key={item.label} className="relative group">
                    <Link
                      href={item.href}
                      className={`inline-flex items-center gap-1 px-2 xl:px-3 py-2 text-[12px] xl:text-[13px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                        isScrolled ? "text-slate-800 hover:text-black" : "text-white hover:text-white/80"
                      }`}
                    >
                      {item.label}
                      <ChevronDown size={14} className={`mt-[1px] transition-colors ${isScrolled ? "text-slate-500" : "text-white/60"}`} />
                    </Link>

                    <div className="absolute left-1/2 top-full mt-2 w-52 -translate-x-1/2 border border-slate-200 bg-white shadow-lg opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 transition-all duration-150">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-3 text-[12px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 hover:text-black"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={
                    item.variant === "primary"
                      ? `inline-flex items-center px-5 py-2.5 text-[12px] xl:text-[13px] font-bold uppercase tracking-wider transition-all ${
                          isScrolled 
                            ? "bg-black text-white hover:bg-[#2E2E2E] active:bg-white active:text-black"
                            : "bg-white text-black hover:bg-[#F0F0F0] active:bg-black active:text-white"
                        }`
                      : item.variant === "secondary"
                      ? `inline-flex items-center px-5 py-2.5 border text-[12px] xl:text-[13px] font-bold uppercase tracking-wider transition-all ${
                          isScrolled 
                            ? "border-slate-300 text-slate-800 hover:border-slate-500 hover:text-black" 
                            : "border-white/40 text-white hover:border-white hover:bg-white/10"
                        }`
                      : `px-2 xl:px-3 py-2 text-[12px] xl:text-[13px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                          isScrolled ? "text-slate-800 hover:text-black" : "text-white hover:text-white/80"
                        }`
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <header
        className={`xl:hidden fixed top-0 left-0 right-0 z-50 h-14 transition-all duration-300 ${
          isScrolled ? "bg-[#FFFFFF] border-b border-slate-200 shadow-sm" : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="flex h-full items-center justify-between px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <div className="relative h-12 w-12 flex-shrink-0">
              <Image
                src="/images/Florida Badgers.png"
                alt="Florida Badgers FCA logo"
                fill
                className="object-contain object-left"
              />
            </div>
            <div className="min-w-0">
              <span
                className={`${clubWordmark.className} block origin-left scale-x-[1.04] text-[14px] font-bold uppercase leading-[0.95] ${
                  isScrolled ? "text-slate-950" : "text-white"
                }`}
              >
                Florida Badgers FCA
              </span>
              <div className={`mt-1 h-[2px] w-full max-w-[150px] ${isScrolled ? "bg-[#B0B0B0]" : "bg-white"}`} />
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={`rounded p-2 transition ${
              isScrolled ? "text-slate-700 hover:bg-slate-100" : "text-white hover:bg-white/10"
            }`}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.28 }}
            className="fixed inset-0 z-[100] bg-white overflow-y-auto"
          >
            <div className="flex items-center justify-between h-14 px-5 border-b border-slate-200">
              <span className="text-base font-black text-slate-900 uppercase tracking-widest">Menu</span>
              <button
                onClick={closeMobileMenu}
                className="p-2 text-slate-700 hover:bg-slate-100 rounded transition"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="p-5 flex flex-col divide-y divide-slate-100">
              {navItems.map((item) => {
                if (item.children?.length) {
                  return (
                    <div key={item.label} className="py-2">
                      <button
                        type="button"
                        onClick={() => setMobileAcademyOpen((prev) => !prev)}
                        className="w-full flex items-center justify-between py-2 text-[15px] font-bold text-slate-900 uppercase tracking-wider"
                      >
                        <Link href={item.href} onClick={closeMobileMenu}>
                          {item.label}
                        </Link>
                        <ChevronDown
                          size={18}
                          className={`transition-transform ${mobileAcademyOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      <AnimatePresence>
                        {mobileAcademyOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pb-2">
                              {item.children.map((child) => (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  onClick={closeMobileMenu}
                                  className="block pl-4 py-2 text-[13px] font-bold uppercase tracking-wider text-slate-700"
                                >
                                  {child.label}
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                return (
                  <div key={item.label} className="py-4">
                    <Link
                      href={item.href}
                      onClick={closeMobileMenu}
                      className={
                        item.variant === "primary"
                          ? "inline-flex items-center px-4 py-2 bg-black text-white text-[13px] font-bold uppercase tracking-wider hover:bg-[#2E2E2E] active:bg-white active:text-black"
                          : item.variant === "secondary"
                          ? "inline-flex items-center px-4 py-2 border border-slate-300 text-slate-900 text-[13px] font-bold uppercase tracking-wider"
                          : "text-[15px] font-bold text-slate-900 uppercase tracking-wider"
                      }
                    >
                      {item.label}
                    </Link>
                  </div>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
