import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { ArrowUpRight, CreditCard } from "@/components/ui/icons";
import CardFan from "@/components/CardFan";

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col items-center px-6 pt-15">
        <div className="flex w-full flex-col items-center gap-8">
          <div className="flex w-full flex-col items-center gap-4">
            <Badge icon={<CreditCard />}>Introducing Squad Card by Banrox</Badge>

            <div className="flex flex-col items-center gap-4 text-center">
              {/*
                72px at the 1440 artboard; clamped so it degrades gracefully on
                narrow viewports, which the Figma frame does not specify.
              */}
              <h1 className="font-heading max-w-[956px] text-[clamp(2.25rem,6.1vw,4.5rem)] leading-none font-normal">
                One card. One line.
                <br />
                Four people who{" "}
                <span className="font-display italic">have your back.</span>
              </h1>
              <p className="max-w-[604px] text-base leading-[1.5] tracking-[-0.32px] text-white/70">
                Squad is a shared credit line built for people who trust each
                other. Everyone gets their own lane, and the squad holds the
                reserve.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              href="/waitlist"
              variant="primary"
              size="lg"
              icon={<ArrowUpRight />}
            >
              Join the Waitlist
            </Button>
            <Button
              href="/invite"
              variant="secondary"
              size="lg"
              icon={<ArrowUpRight />}
            >
              Invite Your Squad
            </Button>
          </div>

          <p className="text-center text-xs leading-[1.5] tracking-[-0.24px] text-white/70">
            <span className="font-medium text-white">2,847</span> people on the
            waitlist
          </p>
        </div>
      </div>

      <CardFan />
    </section>
  );
}
