"use client";

import Image from "next/image";
import Link from "next/link";

const productsLinks = [
  { label: "Credit Monitoring", href: "/products/credit-monitoring" },
  {
    label: "Identity Protection",
    href: "/products/identity-protection",
    highlight: true,
  },
  { label: "Privacy Protect", href: "/products/privacy-protect" },
  { label: "Debt Navigator", href: "/products/debt-navigator" },
  { label: "Student Loan Aid", href: "/products/student-loan-aid" },
  { label: "Payment Processing", href: "/products/payment-processing" },
  { label: "Business Credit", href: "/products/business-credit" },
];

const solutionsLinks = [
  { label: "For Individuals", href: "/solutions/individuals" },
  { label: "For Businesses", href: "/solutions/businesses" },
  { label: "AI-Powered Platform", href: "/solutions/ai-platform" },
  { label: "Real-Time Monitoring", href: "/solutions/real-time-monitoring" },
  { label: "Complete Protection", href: "/solutions/complete-protection" },
];

const toolsLinks = [
  { label: "Financial Calculator", href: "/tools/financial-calculator" },
  { label: "Privacy Protect", href: "/tools/privacy-protect" },
  { label: "Identity Protect", href: "/tools/identity-protect" },
  { label: "Debt Navigator", href: "/tools/debt-navigator" },
  { label: "Student Loan Aid", href: "/tools/student-loan-aid" },
];

const resourcesLinks = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "FAQ", href: "/faq" },
  { label: "Legal & Disclosure", href: "/legal" },
  { label: "Dispute Center", href: "/dispute-center" },
  { label: "Waitlist Signup", href: "/waitlist" },
  { label: "Open A Ticket", href: "/support" },
  { label: "Documents Lab", href: "/documents-lab" },
];

export default function Footer() {
  return (
    <footer className="w-full bg-[#070712] overflow-hidden flex flex-col items-center">
      {/* Container sizer matching 1440px Figma layout */}
      <div className="w-full max-w-[1440px] relative flex flex-col items-center">
        {/* ========================================================================= */}
        {/* TOP SECTION: Starfield, Horizon Glow Arc, BX Vector & Contact Cards        */}
        {/* ========================================================================= */}
        <div className="bg-[#070712] h-[738px] overflow-hidden relative shrink-0 w-full max-w-[1440px]">
          {/* Exact Starfield Asset from Figma */}
          <div className="absolute h-[572px] left-[-193px] top-[-61px] w-[1823px] pointer-events-none">
            <Image
              src="/footer/starfield.svg"
              alt=""
              width={1823}
              height={572}
              className="absolute block inset-0 max-w-none size-full object-cover"
              priority
            />
          </div>

          {/* Glowing Horizon Arc (Ellipse 22065) */}
          <div className="-translate-x-1/2 absolute left-1/2 size-[1544px] top-[205px] pointer-events-none">
            <div className="absolute inset-[-13.41%]">
              <Image
                src="/footer/ellipse-22065.svg"
                alt=""
                width={1957}
                height={1957}
                className="block max-w-none size-full"
              />
            </div>
          </div>

          {/* Large Stylized 'BX' Watermark Vector */}
          <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[378px] left-1/2 top-[calc(50%+180px)] w-[332px] pointer-events-none">
            <Image
              src="/footer/bx-vector.svg"
              alt=""
              width={332}
              height={378}
              className="absolute block inset-0 max-w-none size-full"
            />
          </div>

          {/* Radial Top Glow & Linear Fade Overlay */}
          <div
            className="absolute h-[738px] left-0 top-0 w-full pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 50% 20% at 50% 0%, rgba(38,75,255,0.3) 0%, transparent 100%), linear-gradient(180deg, rgba(8, 8, 20, 0) 70%, rgb(8, 8, 20) 100%)",
            }}
          />

          {/* Contact Cards Row */}
          <div className="-translate-x-1/2 -translate-y-1/2 absolute grid grid-rows-1 grid-cols-3 gap-[32px] left-1/2 top-1/2 z-10 max-w-[1240px] px-4 w-full justify-center">
            {/* Card 1: Email Us */}
            <div className="border-[1.5px] border-solid border-white/15 flex flex-col gap-[40px] items-center justify-center overflow-hidden p-[40px] relative rounded-[32px] shrink-0 w-[392px] bg-white/[0.03] backdrop-blur-[32px] shadow-[inset_0px_4px_20px_0px_rgba(255,255,255,0.08)]">
              {/* Top Light Highlight Asset (Ellipse 5979) */}
              <div className="absolute h-[121px] left-[106.84px] top-[-121.5px] w-[356px] pointer-events-none">
                <div className="absolute inset-[-165.29%_-56.18%]">
                  <Image
                    src="/footer/ellipse-5979.png"
                    alt=""
                    width={756}
                    height={521}
                    className="block max-w-none size-full"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-[16px] items-center justify-center relative shrink-0 text-center w-full">
                <h3 className="font-heading leading-none relative shrink-0 text-[24px] font-normal text-white w-full">
                  Email Us
                </h3>
                <a
                  href="mailto:info@banrox.com"
                  className="font-sans font-normal leading-[1.5] relative shrink-0 text-[16px] text-white/70 tracking-[-0.32px] hover:text-white transition-colors w-full"
                >
                  info@banrox.com
                </a>
              </div>
            </div>

            {/* Card 2: Call Us */}
            <div className="border-[1.5px] border-solid border-white/15 flex flex-col gap-[40px] items-center justify-center overflow-hidden p-[40px] relative rounded-[32px] shrink-0 w-[392px] bg-white/[0.03] backdrop-blur-[32px] shadow-[inset_0px_4px_20px_0px_rgba(255,255,255,0.08)]">
              {/* Top Light Highlight Asset (Ellipse 5979) */}
              <div className="absolute h-[121px] left-[106.84px] top-[-121.5px] w-[356px] pointer-events-none">
                <div className="absolute inset-[-165.29%_-56.18%]">
                  <Image
                    src="/footer/ellipse-5979.png"
                    alt=""
                    width={756}
                    height={521}
                    className="block max-w-none size-full"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-[16px] items-center justify-center relative shrink-0 text-center w-full">
                <h3 className="font-heading leading-none relative shrink-0 text-[24px] font-normal text-white w-full">
                  Call Us
                </h3>
                <div className="font-sans font-normal leading-[1.5] relative shrink-0 text-[16px] text-white/70 tracking-[-0.32px] w-full">
                  <p className="mb-0">Corporate: (858)324-8882</p>
                  <p>Customer Service: (888) 789-1887</p>
                </div>
              </div>
            </div>

            {/* Card 3: Visit Us */}
            <div className="border-[1.5px] border-solid border-white/15 flex flex-col gap-[40px] items-center justify-center overflow-hidden p-[40px] relative rounded-[32px] shrink-0 w-[392px] bg-white/[0.03] backdrop-blur-[32px] shadow-[inset_0px_4px_20px_0px_rgba(255,255,255,0.08)]">
              {/* Top Light Highlight Asset (Ellipse 5979) */}
              <div className="absolute h-[121px] left-[106.84px] top-[-121.5px] w-[356px] pointer-events-none">
                <div className="absolute inset-[-165.29%_-56.18%]">
                  <Image
                    src="/footer/ellipse-5979.png"
                    alt=""
                    width={756}
                    height={521}
                    className="block max-w-none size-full"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-[16px] items-center justify-center relative shrink-0 text-center w-full">
                <h3 className="font-heading leading-none relative shrink-0 text-[24px] font-normal text-white w-full">
                  Visit Us
                </h3>
                <div className="font-sans font-normal leading-[1.5] relative shrink-0 text-[16px] text-white/70 tracking-[-0.32px] w-full">
                  <p className="mb-0">40 N Altadena Dr Ste 105</p>
                  <p>Pasadena, CA 91107</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM SECTION: Brand, Socials, Navigation Grid, Disclaimers & Watermark */}
        {/* ========================================================================= */}
        <div className="bg-[#080814] h-[1140px] overflow-hidden relative shrink-0 w-full max-w-[1440px]">
          {/* Top Gradient Tint Overlay */}
          <div className="absolute bg-gradient-to-b from-black to-[#8585e9] h-[955px] left-0 opacity-4 top-0 w-full pointer-events-none" />

          {/* Bottom Glow Ellipse Assets */}
          <div className="-translate-x-1/2 absolute bottom-[-119px] left-[calc(50%+571.5px)] size-[669px] pointer-events-none">
            <div className="absolute inset-[-44.84%]">
              <Image
                src="/footer/ellipse-6133.svg"
                alt=""
                width={1269}
                height={1269}
                className="block max-w-none size-full"
              />
            </div>
          </div>

          <div className="-translate-x-1/2 absolute bottom-[-127px] left-[calc(50%-468px)] size-[640px] pointer-events-none">
            <div className="absolute inset-[-46.88%]">
              <Image
                src="/footer/ellipse-6134.svg"
                alt=""
                width={1240}
                height={1240}
                className="block max-w-none size-full"
              />
            </div>
          </div>

          <div className="-translate-x-1/2 absolute bottom-[-206px] left-[calc(50%+6.5px)] size-[695px] pointer-events-none">
            <div className="absolute inset-[-43.17%]">
              <Image
                src="/footer/ellipse-6135.svg"
                alt=""
                width={1295}
                height={1295}
                className="block max-w-none size-full"
              />
            </div>
          </div>

          {/* Navigation Links Columns (Right Side) */}
          <div className="absolute flex gap-[32px] items-start leading-none right-[100px] text-[16px] top-[80px] tracking-[-0.32px] z-10">
            {/* Products Column */}
            <div className="flex flex-col gap-[32px] items-start relative shrink-0 w-[180px]">
              <h4 className="font-sans font-semibold text-white w-full">
                Products
              </h4>
              {productsLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`font-sans font-normal transition-colors w-full ${
                    item.highlight
                      ? "text-[#8585e9]"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Solutions Column */}
            <div className="flex flex-col gap-[32px] items-start relative shrink-0 w-[180px]">
              <h4 className="font-sans font-semibold text-white w-full">
                Solutions
              </h4>
              {solutionsLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="font-sans font-normal text-white/70 hover:text-white transition-colors w-full"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Tools Column */}
            <div className="flex flex-col gap-[32px] items-start relative shrink-0 w-[180px]">
              <h4 className="font-sans font-semibold text-white w-full">
                Tools
              </h4>
              {toolsLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="font-sans font-normal text-white/70 hover:text-white transition-colors w-full"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Resources Column */}
            <div className="flex flex-col gap-[32px] items-start relative shrink-0 w-[180px]">
              <h4 className="font-sans font-semibold text-white w-full">
                Resources
              </h4>
              {resourcesLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="font-sans font-normal text-white/70 hover:text-white transition-colors w-full"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Brand Info & Social Icons (Left Side) */}
          <div className="absolute flex flex-col gap-[40px] items-start left-[100px] top-[80px] w-[298px] z-10">
            {/* White Logomark Asset */}
            <Link
              href="/"
              aria-label="Banrox home"
              className="h-[32px] overflow-hidden relative shrink-0 w-[150px] block"
            >
              <Image
                src="/footer/logo-white.svg"
                alt="Banrox"
                width={150}
                height={32}
                className="h-[32px] w-[150px] object-contain object-left"
                priority
              />
            </Link>

            <p className="font-sans font-normal leading-[1.5] opacity-70 text-[16px] text-white tracking-[-0.32px] w-full">
              Banrox is a financial operating system protecting Americans&apos;
              credit, identity, privacy, and business health through AI-powered
              monitoring—24/7
            </p>

            {/* Social Icons with exact Figma SVG assets */}
            <div className="flex gap-[16px] items-center relative shrink-0">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="bg-[rgba(255,255,255,0.02)] border border-solid border-white/15 overflow-hidden rounded-[30px] shrink-0 size-[40px] flex items-center justify-center transition-colors hover:bg-white/10"
              >
                <Image
                  src="/footer/facebook.svg"
                  alt="Facebook"
                  width={17}
                  height={17}
                  className="size-[17px]"
                />
              </a>

              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="bg-[rgba(255,255,255,0.02)] border border-solid border-white/15 overflow-hidden rounded-[30px] shrink-0 size-[40px] flex items-center justify-center transition-colors hover:bg-white/10"
              >
                <Image
                  src="/footer/linkedin.svg"
                  alt="LinkedIn"
                  width={17}
                  height={17}
                  className="size-[17px]"
                />
              </a>

              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter)"
                className="bg-[rgba(255,255,255,0.02)] border border-solid border-white/15 overflow-hidden rounded-[30px] shrink-0 size-[40px] flex items-center justify-center transition-colors hover:bg-white/10"
              >
                <Image
                  src="/footer/twitter-x.svg"
                  alt="X (Twitter)"
                  width={16}
                  height={16}
                  className="size-[16px]"
                />
              </a>
            </div>
          </div>

          {/* Legal Disclaimer Box */}
          <div className="absolute bg-[rgba(0,0,0,0.1)] border-[1.5px] border-[rgba(255,255,255,0.05)] border-solid flex flex-col font-sans font-normal gap-[24px] items-start left-[100px] overflow-hidden p-[40px] rounded-[32px] text-[14px] text-center text-white top-[584px] tracking-[-0.28px] w-[1240px] backdrop-blur-md z-10">
            <p className="leading-[1.5] opacity-70 w-full">
              Banrox is a financial operating system protecting Americans&apos;
              credit, identity, privacy, and business health through AI-powered
              monitoring—24/7.
            </p>
            <p className="leading-[1.5] opacity-70 w-full">
              Loan approval and terms are not guaranteed and depend on factors
              such as creditworthiness and income verification.{" "}
              <span className="uppercase font-semibold">BANROX</span> Inc. is
              not liable for financial outcomes resulting from the use of its
              services. Late or missed payments may negatively impact your
              credit score.
            </p>
            <p className="leading-[1.5] opacity-70 w-full">
              By using our services, you consent to communication via SMS,
              email, and phone.
            </p>
          </div>

          {/* Bottom Copyright & Terms Bar */}
          <div className="absolute flex font-sans font-normal items-center justify-between leading-none left-[100px] text-[14px] text-white top-[837px] tracking-[-0.28px] uppercase w-[1240px] whitespace-nowrap z-10">
            <p className="opacity-70">
              Copyright © 2025 Banrox Inc. All rights reserved.
            </p>
            <div className="flex gap-[32px] items-center">
              <Link
                href="/privacy"
                className="opacity-70 hover:opacity-100 transition-opacity"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="opacity-70 hover:opacity-100 transition-opacity"
              >
                Terms &amp; Conditions
              </Link>
            </div>
          </div>

          {/* Giant Bottom Typography Watermark "Banrox" */}
          <p className="-translate-x-1/2 absolute bg-clip-text bg-gradient-to-b from-white/5 to-white/60 bottom-[253px] font-display left-[690.5px] text-[transparent] text-center translate-y-full whitespace-nowrap pointer-events-none select-none">
            <span className="leading-none text-[498px] italic font-normal">
              Ban
            </span>
            <span className="font-heading leading-none text-[498px] italic font-normal">
              rox
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
