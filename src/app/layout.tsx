import type { Metadata } from "next";
import { inter, interTight, ztFormom } from "./fonts";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import DeckNav from "@/components/scroll/DeckNav";
import ScrollSequence from "@/components/scroll/ScrollSequence";
import "./globals.css";

export const metadata: Metadata = {
  title: "Banrox | Fintech",
  description: "Banrox Fintech",
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
          <NavBar />
          {children}
          <Footer />
          <DeckNav />
        </ScrollSequence>
      </body>
    </html>
  );
}

