import { Inter, Inter_Tight } from "next/font/google";
import localFont from "next/font/local";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const ztFormom = localFont({
  src: "../../public/ZT Formom.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-zt-formom",
  display: "swap",
});
