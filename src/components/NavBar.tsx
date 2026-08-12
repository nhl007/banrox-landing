"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { ChevronDown } from "@/components/ui/icons";

type NavItem = { label: string; href: string; hasDropdown?: boolean };

const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Personal", href: "/personal", hasDropdown: true },
  { label: "Business", href: "/business", hasDropdown: true },
  { label: "About Us", href: "/about" },
];

function NavLink({ item }: { item: NavItem }) {
  return (
    <Link
      href={item.href}
      className="flex items-center gap-1 text-base tracking-[-0.32px] text-ink transition-opacity hover:opacity-70"
    >
      {item.label}
      {item.hasDropdown ? <ChevronDown /> : null}
    </Link>
  );
}

export default function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    /*
      The transform goes on the pill, not the <header>: the header keeps its
      72px slot in flow so nothing below it moves, and the pill is the thing
      that reads as dropping in and folding away.
    */
    <header
      className="w-full px-4 pt-4 sm:px-6 lg:px-[100px]"
      data-sequence-section="navbar"
    >
      <nav
        className="bg-nav-pill relative mx-auto flex h-14 w-full max-w-[1280px] items-center justify-between rounded-xl border-[1.5px] border-white/20 py-1 pr-1 pl-4"
        data-reveal="nav-pill"
      >
        <Link
          href="/"
          aria-label="Banrox home"
          className="relative block h-6 w-[110px] shrink-0"
        >
          <Image
            src="/logo.png"
            alt="Banrox"
            fill
            sizes="110px"
            className="object-contain"
            priority
          />
        </Link>

        {/* Centred on the pill itself, not on the space between logo and CTAs. */}
        <div className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-10 md:flex">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {/* Visibility lives on a wrapper: a `hidden` passed through Button's
              className would tie with its own `inline-flex` and lose. */}
          <span className="hidden sm:block">
            <Button href="/login" variant="ghost">
              Login
            </Button>
          </span>
          <Button href="/signup" variant="primary">
            Sign Up
          </Button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle navigation"
            className="ml-1 flex size-10 items-center justify-center rounded-lg text-ink md:hidden"
          >
            <span className="relative block h-4 w-5">
              <span
                className={`absolute left-0 block h-0.5 w-full rounded bg-current transition-transform ${
                  open ? "top-1/2 rotate-45" : "top-0.5"
                }`}
              />
              <span
                className={`absolute left-0 block h-0.5 w-full rounded bg-current transition-transform ${
                  open ? "top-1/2 -rotate-45" : "bottom-0.5"
                }`}
              />
            </span>
          </button>
        </div>
      </nav>

      {/* No mobile layout was specified in Figma; this keeps the links reachable. */}
      {open ? (
        <div className="bg-nav-pill mx-auto mt-2 flex w-full max-w-[1240px] flex-col gap-4 rounded-xl border-[1.5px] border-white/20 p-4 md:hidden">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
          <Link
            href="/login"
            className="text-base tracking-[-0.32px] text-ink sm:hidden"
          >
            Login
          </Link>
        </div>
      ) : null}
    </header>
  );
}
