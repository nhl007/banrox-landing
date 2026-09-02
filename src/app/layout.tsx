import type { Metadata, Viewport } from "next";
import { inter, interTight, ztFormom } from "./fonts";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import DeckNav from "@/components/scroll/DeckNav";
import ArtboardFit from "@/components/ArtboardFit";
import ScrollSequence from "@/components/scroll/ScrollSequence";
import "./globals.css";

export const metadata: Metadata = {
  title: "Banrox | Fintech",
  description: "Banrox Fintech",
};

/*
 * Stated rather than left to the framework's default, because everything below
 * depends on it: a page that reports a fixed width to the browser is rendered
 * at that width and shrunk to fit, which is the one outcome none of the
 * responsive work here would survive. No maximum-scale and no user-scalable:
 * false either — pinch-zoom is how people read.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} ${ztFormom.variable} h-full antialiased`}
    >
      {/*
        ScrollSequence wraps the navbar as well as the page: the navbar is the
        first state in the sequence, and it lives outside <main>. It renders
        `display: contents`, so it adds no box and the body's flex column is
        untouched. Everything inside stays a server component.
      */}
      <body className="min-h-full flex flex-col">
        <ScrollSequence>
          {/*
            First, so its effect runs before the sequence measures the page:
            it changes how tall three of the sections are. See the file.
          */}
          <ArtboardFit />
          <NavBar />
          {children}
          <Footer />
          {/* <DeckNav /> */}
        </ScrollSequence>
      </body>
    </html>
  );
}
