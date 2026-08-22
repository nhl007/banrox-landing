"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { ChevronDown, MenuIcon } from "@/components/ui/icons";

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
      className="text-ink flex items-center gap-1 text-base tracking-[-0.32px] transition-opacity hover:opacity-70"
    >
      {item.label}
      {item.hasDropdown ? <ChevronDown /> : null}
    </Link>
  );
}

export default function NavBar() {
  const [open, setOpen] = useState(false);

  /*
   * The drawer covers the page, so the page must not scroll underneath it —
   * otherwise a swipe over the overlay moves the deck behind it and closing the
   * menu drops you somewhere you did not choose to be. Also closed by Escape,
   * because a full-screen overlay with no keyboard way out is a trap.
   */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    /*
      The transform goes on the pill, not the <header>: the header keeps its
      72px slot in flow so nothing below it moves, and the pill is the thing
      that reads as dropping in and folding away.
    */
    <header
      /*
        8px above the pill on a phone and nothing below it — both the artboard's.
        The mobile frame opens the pill 8px under the status bar and then leaves
        48px of nothing before the hero's badge, which is the hero's own
        --screen-pad and not the bar's to supply. --nav-h stays 16 + 56 for the
        tiers above the gate, where it is the bar's slot in flow and the deck
        reads it.
      */
      className="w-full px-4 pt-2 sm:px-6 sm:pt-4 lg:px-[100px]"
      data-sequence-section="navbar"
    >
      <nav
        /*
          48px tall on a phone with an even 12px inside it, which is what a pill
          holding a 24px logo and a 24px control comes to. From the gate up it
          is 56 with the asymmetric padding the buttons on the right need.
        */
        className="bg-nav-pill relative mx-auto flex h-12 w-full max-w-[1280px] items-center justify-between rounded-xl border-[1.5px] border-white/20 p-3 sm:h-14 sm:py-1 sm:pr-1 sm:pl-4"
        data-reveal="nav-pill"
      >
        <Link
          href="/"
          aria-label="Banrox home"
          /*
            24px tall in both tiers, because that is the logo. The hit area is
            put back by a pseudo-element rather than by a taller box: a 44px box
            here would be 44px of a 48px pill and push the logo off its centre.
          */
          className="relative flex h-6 w-[110px] shrink-0 items-center after:absolute after:inset-x-0 after:-inset-y-2.5 after:content-['']"
        >
          <Image
            src="/logo.png"
            alt="Banrox"
            width={110}
            height={24}
            sizes="110px"
            className="h-6 w-[110px] object-contain"
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
              className would tie with its own `inline-flex` and lose.

              Both of them are gone on a phone. The artboard puts nothing on the
              right of the pill but the menu control — a 48px pill has no room
              for a 48px button, and the same two calls to action are the first
              thing under the heading a screen later. */}
          <span className="hidden sm:block">
            <Button href="/login" variant="ghost">
              Login
            </Button>
          </span>
          <span className="hidden sm:block">
            <Button href="/signup" variant="primary">
              Sign Up
            </Button>
          </span>
          {/* 24x24 drawn, 44x44 to a finger: the hit area is a pseudo-element,
              so the control keeps the size the artboard gives it and the pill
              keeps its 48px. */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="nav-drawer"
            aria-label="Toggle navigation"
            className="text-ink relative flex size-6 items-center justify-center transition-opacity active:opacity-60 sm:ml-1 md:hidden after:absolute after:-inset-2.5 after:content-['']"
          >
            <MenuIcon />
          </button>
        </div>
      </nav>

      {/*
        A full-screen overlay rather than a panel tucked under the pill. The
        page behind it is a deck on a tablet and a long column on a phone, and
        either way a menu that shares the screen with it competes with whatever
        is moving underneath.

        Rendered always and hidden with translate rather than mounted on demand,
        so it can slide rather than appear — and every link closes it, including
        the ones that only change the hash.
      */}
      <div
        id="nav-drawer"
        className={`fixed inset-0 z-[70] md:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 h-full w-full bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`bg-nav-pill absolute top-0 right-0 flex h-full w-[min(20rem,85vw)] flex-col gap-2 overflow-y-auto p-6 pt-5 shadow-2xl transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/*
            The drawer gets its own header rather than leaving a gap where the
            pill would be. The pill is *behind* this panel once it slides in, so
            without these the menu is a sheet of links with no mark on it and no
            visible way out but the strip of page down the left edge.
          */}
          <div className="mb-3 flex items-center justify-between">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              tabIndex={open ? 0 : -1}
              aria-label="Banrox home"
              className="flex h-11 items-center"
            >
              <Image
                src="/logo.png"
                alt="Banrox"
                width={110}
                height={24}
                sizes="110px"
                className="h-6 w-[110px] object-contain"
              />
            </Link>
            {/* The same two bars the hamburger is built from, crossed — so the
                mark that opened the menu is the mark that closes it. */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              tabIndex={open ? 0 : -1}
              aria-label="Close navigation"
              className="text-ink -mr-2 flex size-11 items-center justify-center rounded-lg transition-colors active:bg-black/10"
            >
              <span className="relative block h-4 w-5">
                <span className="absolute top-1/2 left-0 block h-0.5 w-full rotate-45 rounded bg-current" />
                <span className="absolute top-1/2 left-0 block h-0.5 w-full -rotate-45 rounded bg-current" />
              </span>
            </button>
          </div>

          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              tabIndex={open ? 0 : -1}
              className="text-ink flex min-h-[52px] items-center rounded-lg px-3 text-lg font-medium tracking-[-0.02em] transition-colors active:bg-black/10"
            >
              {item.label}
            </Link>
          ))}

          <span className="my-2 block h-px bg-black/10" />

          <Link
            href="/login"
            onClick={() => setOpen(false)}
            tabIndex={open ? 0 : -1}
            className="text-ink flex min-h-[52px] items-center rounded-lg px-3 text-lg font-medium tracking-[-0.02em] transition-colors active:bg-black/10"
          >
            Login
          </Link>

          {/*
            Sign Up moved in here below the gate, where the pill no longer
            carries it. It is the one thing in the bar that does something
            rather than going somewhere, and a nav with no way to act on it is
            not a smaller nav, it is a broken one.
          */}
          <Button
            href="/signup"
            variant="primary"
            size="lg"
            onClick={() => setOpen(false)}
            tabIndex={open ? 0 : -1}
            className="mt-2 w-full sm:hidden"
          >
            Sign Up
          </Button>
        </div>
      </div>
    </header>
  );
}
