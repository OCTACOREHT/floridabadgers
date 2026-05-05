"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Montserrat, Oswald } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const clubWordmark = Oswald({
  subsets: ["latin"],
  weight: ["500", "700"],
});

type SubItem = { label: string; href: string };
type NavItem = { label: string; href: string; subItems?: SubItem[] };

const leftNavItems: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "Football Club",
    href: "/club",
    subItems: [
      { label: "Badgers Academy", href: "/academy" },
      { label: "Football League", href: "/league" },
      { label: "Football News", href: "/news" },
      { label: "Football Shop", href: "/shop" },
    ],
  },
  {
    label: "Badgers Academy",
    href: "/academy",
    subItems: [
      { label: "U7", href: "/academy/u7" },
      { label: "U9", href: "/academy/u9" },
      { label: "U11", href: "/academy/u11" },
      { label: "U13", href: "/academy/u13" },
      { label: "U15", href: "/academy/u15" },
      { label: "U17", href: "/academy/u17" },
    ],
  },
];

const rightNavItems: NavItem[] = [
  {
    label: "Men's First Team",
    href: "/first-team",
    subItems: [
      { label: "Become part of the senior team", href: "/join" },
      { label: "Florida Badgers FCA", href: "/about" },
      { label: "News", href: "/news" },
      { label: "Team", href: "/team" },
    ],
  },
  { label: "Match Schedule", href: "/schedule" },
  {
    label: "Features",
    href: "/features",
    subItems: [
      { label: "Gallery", href: "/gallery" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
];

function DesktopDropdown({ item }: { item: NavItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="relative h-full flex items-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Link
        href={item.href}
        className="flex items-center gap-1.5 px-2 xl:px-3 py-2 text-[13px] xl:text-[14px] font-bold text-slate-800 uppercase tracking-wider transition-colors hover:text-black whitespace-nowrap"
      >
        {item.label}
        {item.subItems && (
          <ChevronDown
            size={13}
            className={`transition-transform duration-300 ${
              isOpen ? "rotate-180 text-black" : "text-slate-400"
            }`}
          />
        )}
      </Link>

      <AnimatePresence>
        {isOpen && item.subItems && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute top-[80%] left-0 mt-2 w-60 p-2 bg-white border border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.12)] z-50"
          >
            <div className="absolute -top-4 left-0 right-0 h-4 bg-transparent" />
            {item.subItems.map((sub, i) => (
              <Link
                key={i}
                href={sub.href}
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-slate-600 hover:text-black hover:bg-slate-50 transition-all"
              >
                <span className="w-1 h-1 rounded-full bg-slate-400 flex-shrink-0" />
                {sub.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={montserrat.className}>
      {/* ─── DESKTOP ─── */}
      <header
        className={`hidden lg:block fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white ${
          isScrolled ? "shadow-md" : "border-b border-slate-200"
        }`}
      >
        <div className="max-w-[1280px] mx-auto flex items-center h-16 px-4 xl:px-8 gap-4">
          {/* Left Logo */}
          <div className="relative z-10">
            <Link href="/" className="relative flex items-center justify-center w-16 h-16 translate-y-1">
              <Image
                src="/images/Florida Badgers.png"
                alt="Florida Badgers FCA Logo"
                fill
                className="object-contain"
                priority
              />
            </Link>
          </div>

          {/* Desktop Items */}
          <nav className="flex-1 flex items-center justify-center gap-3 xl:gap-5">
            {[...leftNavItems, ...rightNavItems].map((item, i) => (
              <DesktopDropdown key={i} item={item} />
            ))}
          </nav>
        </div>
      </header>

      {/* ─── MOBILE HEADER ─── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 h-14">
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
                className={`${clubWordmark.className} block origin-left scale-x-[1.04] text-[14px] font-bold uppercase leading-[0.95] text-slate-950`}
              >
                Florida Badgers FCA
              </span>
              <div className="mt-1 h-[2px] w-full max-w-[150px] bg-[#1e3a5f]" />
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded transition"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* ─── MOBILE OVERLAY ─── */}
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
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-700 hover:bg-slate-100 rounded transition"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="p-5 flex flex-col divide-y divide-slate-100">
              {[...leftNavItems, ...rightNavItems].map((item, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between py-4">
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-[15px] font-bold text-slate-900 uppercase tracking-wider"
                    >
                      {item.label}
                    </Link>
                    {item.subItems && (
                      <button
                        onClick={() => setMobileExpanded(mobileExpanded === i ? null : i)}
                        className="p-1 text-slate-400 hover:text-slate-700 transition"
                        aria-label="Expand"
                      >
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${mobileExpanded === i ? "rotate-180" : ""}`}
                        />
                      </button>
                    )}
                  </div>

                  <AnimatePresence>
                    {mobileExpanded === i && item.subItems && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col pb-4 pl-4 border-l-2 border-slate-200 gap-1">
                          {item.subItems.map((sub, j) => (
                            <Link
                              key={j}
                              href={sub.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="py-2 text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
