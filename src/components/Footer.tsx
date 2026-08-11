import Image from "next/image";
import Link from "next/link";
import Twinkle from "@/components/footer/Twinkle";

/*
 * The footer is authored against Figma's 1440 artboard, and its content stays
 * there — the nav columns, the disclaimer and the wordmark are all placed with
 * fixed insets that only mean anything inside that box.
 *
 * Its *backgrounds* are not. Sky, horizon and glow used to be clipped to the
 * same 1440 as the content, so on any wider window the page ended in two hard
 * vertical seams with flat black beyond them. The two bands below are now
 * full-bleed and carry their own background layers, and each wraps its content
 * in a centred 1440 column. Anything that has to follow the window is expressed
 * as a percentage of the band rather than in px, which reproduces the artboard
 * exactly at 1440 and grows from there.
 *
 * Nothing here is scroll-driven. The footer is not a section in the scroll
 * sequence — it is what the page settles onto once the sequence has finished —
 * so its ambient motion is CSS running on its own clock (see globals.css) and
 * its cards answer the pointer rather than the scrollbar.
 */

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

const navColumns = [
  { title: "Products", links: productsLinks },
  { title: "Solutions", links: solutionsLinks },
  { title: "Tools", links: toolsLinks },
  { title: "Resources", links: resourcesLinks },
];

const socials = [
  { href: "https://facebook.com", label: "Facebook", src: "/footer/facebook.svg", size: 17 },
  { href: "https://linkedin.com", label: "LinkedIn", src: "/footer/linkedin.svg", size: 17 },
  { href: "https://x.com", label: "X (Twitter)", src: "/footer/twitter-x.svg", size: 16 },
];

/*
 * One of the three contact cards.
 *
 * Extracted rather than written out three times: the hover state is the only
 * motion in the footer a visitor causes themselves, and three copies of it are
 * three chances for them to drift apart.
 */
function ContactCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative flex w-[392px] shrink-0 flex-col items-center justify-center gap-[40px] overflow-hidden rounded-[32px] border-[1.5px] border-solid border-white/15 bg-white/[0.03] p-[40px] shadow-[inset_0px_4px_20px_0px_rgba(255,255,255,0.08)] backdrop-blur-[32px] transition-[transform,background-color,border-color,box-shadow] duration-300 ease-out hover:-translate-y-1.5 hover:border-white/30 hover:bg-white/[0.06] hover:shadow-[inset_0px_4px_20px_0px_rgba(255,255,255,0.14),0_20px_44px_-14px_rgba(38,75,255,0.5)]">
      {/* Top Light Highlight Asset (Ellipse 5979). It comes up with the card, so
          the hover reads as a light switching on rather than a box moving. */}
      <div className="pointer-events-none absolute top-[-121.5px] left-[106.84px] h-[121px] w-[356px] opacity-80 transition-opacity duration-300 ease-out group-hover:opacity-100">
        <div className="absolute inset-[-165.29%_-56.18%]">
          <Image
            src="/footer/ellipse-5979.png"
            alt=""
            width={756}
            height={521}
            className="block size-full max-w-none"
          />
        </div>
      </div>

      <div className="relative flex w-full shrink-0 flex-col items-center justify-center gap-[16px] text-center">
        <h3 className="font-heading relative w-full shrink-0 text-[24px] leading-none font-normal text-white">
          {title}
        </h3>
        <div className="font-sans relative w-full shrink-0 text-[16px] leading-[1.5] font-normal tracking-[-0.32px] text-white/70">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="flex w-full flex-col items-center overflow-x-clip bg-[#070712]">
      {/* ========================================================================= */}
      {/* TOP BAND: Starfield, Horizon Glow Arc, BX Vector & Contact Cards           */}
      {/* ========================================================================= */}
      <div className="relative h-[738px] w-full shrink-0 overflow-hidden bg-[#070712]">
        {/*
          The sky. Sized in percentages so it keeps the artboard's own ~13%
          overhang on either side at any width — the asset is 1823 wide against
          a 1440 artboard — and cropped rather than stretched, because these are
          round stars and the SVG declares preserveAspectRatio="none".

          The drift sits on this box so the sky and the stars twinkling in it
          move together — see Twinkle for why those are two layers.
        */}
        <div className="footer-drift pointer-events-none absolute top-[-61px] left-[-13.3%] h-[572px] w-[126.6%]">
          <Image
            src="/footer/starfield.svg"
            alt=""
            width={1823}
            height={572}
            className="absolute inset-0 block size-full max-w-none object-cover"
            priority
          />
          <Twinkle className="absolute inset-0 block size-full" />
        </div>

        {/*
          The horizon (Ellipse 22065). Its width follows the window while its
          height stays put, so the arc flattens as the window widens rather than
          becoming a circle sitting in the middle of it — which is what a horizon
          does, and what keeps its crest the same distance above the cards. The
          asset is authored preserveAspectRatio="none" for exactly this. max()
          rather than a bare percentage so it cannot collapse into a narrow
          vertical ellipse on a phone.
        */}
        <div
          className="pointer-events-none absolute top-[205px] left-1/2 h-[1544px] -translate-x-1/2"
          style={{ width: "max(1544px, 107.23%)" }}
        >
          <div className="footer-horizon absolute inset-[-13.41%]">
            <Image
              src="/footer/ellipse-22065.svg"
              alt=""
              width={1957}
              height={1957}
              className="block size-full max-w-none"
            />
          </div>
        </div>

        {/* Large Stylized 'BX' Watermark Vector */}
        <div className="pointer-events-none absolute top-[calc(50%+180px)] left-1/2 h-[378px] w-[332px] -translate-x-1/2 -translate-y-1/2">
          <Image
            src="/footer/bx-vector.svg"
            alt=""
            width={332}
            height={378}
            className="footer-mark absolute inset-0 block size-full max-w-none"
          />
        </div>

        {/* Radial Top Glow & Linear Fade Overlay. Both stops are already
            percentages, so this needed nothing but a full-bleed box. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 50% 20% at 50% 0%, rgba(38,75,255,0.3) 0%, transparent 100%), linear-gradient(180deg, rgba(8, 8, 20, 0) 70%, rgb(8, 8, 20) 100%)",
          }}
        />

        {/* Contact Cards Row */}
        <div className="absolute top-1/2 left-1/2 z-10 grid w-full max-w-[1240px] -translate-x-1/2 -translate-y-1/2 grid-cols-3 grid-rows-1 justify-center gap-[32px] px-4">
          <ContactCard title="Email Us">
            <a
              href="mailto:info@banrox.com"
              className="transition-colors hover:text-white"
            >
              info@banrox.com
            </a>
          </ContactCard>

          <ContactCard title="Call Us">
            <p className="mb-0">Corporate: (858)324-8882</p>
            <p>Customer Service: (888) 789-1887</p>
          </ContactCard>

          <ContactCard title="Visit Us">
            <p className="mb-0">40 N Altadena Dr Ste 105</p>
            <p>Pasadena, CA 91107</p>
          </ContactCard>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM BAND: Brand, Socials, Navigation Grid, Disclaimers & Watermark      */}
      {/* ========================================================================= */}
      <div className="relative h-[1140px] w-full shrink-0 overflow-hidden bg-[#080814]">
        {/*
          Top Gradient Tint Overlay — full bleed, so the band does not change
          colour at the 1440 mark.

          Full height too, with its final stop at the 955/1140 the artboard puts
          it at and nothing after: a gradient box that simply ended there left a
          hard horizontal edge across the whole band where the tint stopped. At
          1440 the glows below happen to sit under it and hide it; on a wider
          window they no longer reach that far out and the edge is plain. Holding
          the last stop to the bottom is the same paint above 955 and no seam.
        */}
        <div
          className="pointer-events-none absolute inset-0 opacity-4"
          style={{
            backgroundImage:
              "linear-gradient(180deg, #000000 0%, #8585e9 83.77%, #8585e9 100%)",
          }}
        />

        {/* Everything below is placed against the artboard, so it lives in the
            centred 1440 column rather than in the full-bleed band. */}
        <div className="relative mx-auto h-full w-full max-w-[1440px]">
          {/* Bottom Glow Ellipse Assets */}
          <div className="pointer-events-none absolute bottom-[-119px] left-[calc(50%+571.5px)] size-[669px] -translate-x-1/2">
            <div className="absolute inset-[-44.84%]">
              <Image
                src="/footer/ellipse-6133.svg"
                alt=""
                width={1269}
                height={1269}
                className="block size-full max-w-none"
              />
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-[-127px] left-[calc(50%-468px)] size-[640px] -translate-x-1/2">
            <div className="absolute inset-[-46.88%]">
              <Image
                src="/footer/ellipse-6134.svg"
                alt=""
                width={1240}
                height={1240}
                className="block size-full max-w-none"
              />
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-[-206px] left-[calc(50%+6.5px)] size-[695px] -translate-x-1/2">
            <div className="absolute inset-[-43.17%]">
              <Image
                src="/footer/ellipse-6135.svg"
                alt=""
                width={1295}
                height={1295}
                className="block size-full max-w-none"
              />
            </div>
          </div>

          {/* Navigation Links Columns (Right Side) */}
          <div className="absolute top-[80px] right-[100px] z-10 flex items-start gap-[32px] text-[16px] leading-none tracking-[-0.32px]">
            {navColumns.map((column) => (
              <div
                key={column.title}
                className="relative flex w-[180px] shrink-0 flex-col items-start gap-[32px]"
              >
                <h4 className="font-sans w-full font-semibold text-white">
                  {column.title}
                </h4>
                {column.links.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`font-sans w-full font-normal transition-colors ${
                      "highlight" in item && item.highlight
                        ? "text-[#8585e9]"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          {/* Brand Info & Social Icons (Left Side) */}
          <div className="absolute top-[80px] left-[100px] z-10 flex w-[298px] flex-col items-start gap-[40px]">
            {/* White Logomark Asset */}
            <Link
              href="/"
              aria-label="Banrox home"
              className="relative block h-[32px] w-[150px] shrink-0 overflow-hidden"
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

            <p className="font-sans w-full text-[16px] leading-[1.5] font-normal tracking-[-0.32px] text-white opacity-70">
              Banrox is a financial operating system protecting Americans&apos;
              credit, identity, privacy, and business health through AI-powered
              monitoring—24/7
            </p>

            {/* Social Icons with exact Figma SVG assets */}
            <div className="relative flex shrink-0 items-center gap-[16px]">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex size-[40px] shrink-0 items-center justify-center overflow-hidden rounded-[30px] border border-solid border-white/15 bg-[rgba(255,255,255,0.02)] transition-colors hover:bg-white/10"
                >
                  <Image
                    src={social.src}
                    alt={social.label}
                    width={social.size}
                    height={social.size}
                    style={{ width: social.size, height: social.size }}
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Legal Disclaimer Box */}
          <div className="font-sans absolute top-[584px] left-[100px] z-10 flex w-[1240px] flex-col items-start gap-[24px] overflow-hidden rounded-[32px] border-[1.5px] border-solid border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.1)] p-[40px] text-center text-[14px] font-normal tracking-[-0.28px] text-white backdrop-blur-md">
            <p className="w-full leading-[1.5] opacity-70">
              Banrox is a financial operating system protecting Americans&apos;
              credit, identity, privacy, and business health through AI-powered
              monitoring—24/7.
            </p>
            <p className="w-full leading-[1.5] opacity-70">
              Loan approval and terms are not guaranteed and depend on factors
              such as creditworthiness and income verification.{" "}
              <span className="font-semibold uppercase">BANROX</span> Inc. is not
              liable for financial outcomes resulting from the use of its
              services. Late or missed payments may negatively impact your credit
              score.
            </p>
            <p className="w-full leading-[1.5] opacity-70">
              By using our services, you consent to communication via SMS, email,
              and phone.
            </p>
          </div>

          {/* Bottom Copyright & Terms Bar */}
          <div className="font-sans absolute top-[837px] left-[100px] z-10 flex w-[1240px] items-center justify-between text-[14px] leading-none font-normal tracking-[-0.28px] whitespace-nowrap text-white uppercase">
            <p className="opacity-70">
              Copyright © 2025 Banrox Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-[32px]">
              <Link
                href="/privacy"
                className="opacity-70 transition-opacity hover:opacity-100"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="opacity-70 transition-opacity hover:opacity-100"
              >
                Terms &amp; Conditions
              </Link>
            </div>
          </div>

          {/* Giant Bottom Typography Watermark "Banrox" */}
          <p className="font-display pointer-events-none absolute bottom-[253px] left-[690.5px] -translate-x-1/2 translate-y-full bg-gradient-to-b from-white/5 to-white/60 bg-clip-text text-center whitespace-nowrap text-[transparent] select-none">
            <span className="text-[498px] leading-none font-normal italic">
              Ban
            </span>
            <span className="font-heading text-[498px] leading-none font-normal italic">
              rox
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
