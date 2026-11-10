"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/history", label: "History" },
  { href: "/guide", label: "Guide" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className="sticky top-0 z-50 bg-warm-bg/95 backdrop-blur-[4px] transition-shadow duration-200"
      style={{
        boxShadow: scrolled
          ? "0 1px 12px rgba(43,33,64,0.06)"
          : "none",
      }}
    >
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-semibold text-accent tracking-tight flex items-center gap-2 group transition-opacity duration-150 hover:opacity-85"
        >
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span>FungiGuard</span>
        </Link>

        {/* Desktop Nav — animated underline links */}
        <div className="hidden sm:flex items-center gap-7">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative text-sm tracking-wide font-medium transition-colors duration-150 py-1 group"
              >
                <span
                  className={
                    isActive
                      ? "text-accent font-semibold"
                      : "text-ink/60 group-hover:text-accent transition-colors duration-150"
                  }
                >
                  {link.label}
                </span>
                {/* Animated underline */}
                <span
                  className="absolute left-0 -bottom-0.5 h-[2px] bg-accent rounded-full origin-left"
                  style={{
                    width: "100%",
                    transform: isActive ? "scaleX(1)" : "scaleX(0)",
                    transitionProperty: "transform",
                    transitionDuration: "250ms",
                    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                />
                {/* Hover underline (lower opacity) */}
                {!isActive && (
                  <span
                    className="absolute left-0 -bottom-0.5 h-[2px] bg-accent/40 rounded-full origin-left scale-x-0 group-hover:scale-x-100"
                    style={{
                      width: "100%",
                      transitionProperty: "transform",
                      transitionDuration: "250ms",
                      transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="sm:hidden p-2 text-ink/60 hover:text-accent transition-colors duration-150 cursor-pointer"
          aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
          aria-expanded={menuOpen}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            {menuOpen ? (
              <path d="M5 5l10 10M15 5L5 15" />
            ) : (
              <path d="M3 5h14M3 10h14M3 15h14" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="sm:hidden bg-warm-bg px-4 py-3 space-y-1 animate-page">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block py-2 text-sm tracking-wide transition-colors duration-150 ${
                  isActive
                    ? "text-accent font-semibold border-l-2 border-accent pl-2.5"
                    : "text-ink/65 hover:text-accent font-medium pl-2.5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
