import AloneVsTogether from "@/components/AloneVsTogether";
import EarlyAccess from "@/components/EarlyAccess";
import Hero from "@/components/Hero";
import HowSquadWorks from "@/components/HowSquadWorks";
import IntelligenceLayer from "@/components/IntelligenceLayer";
import SquadApproves from "@/components/SquadApproves";
import SquadInvitation from "@/components/SquadInvitation";

export default function Home() {
  return (
    <main className="flex-1">
      {/*
        Seven sections, one after another, scrolled the way any page is. Each is
        one window tall above the gate — see .screen in globals.css — and each
        plays its own entrance as it comes into view, which the controller in
        scroll/ScrollSequence.tsx arranges.

        These two wrappers are what is left of the deck this used to be, where
        the seven were stacked in a single windowful and a gesture handed the
        window from one to the next. They do nothing now beyond giving the first
        section something to be :first-child of.
      */}
      <div className="scene-track">
        <div className="scene">
          <Hero />
          <AloneVsTogether />
          <SquadApproves />
          <HowSquadWorks />
          <IntelligenceLayer />
          <SquadInvitation />
          <EarlyAccess />
        </div>
      </div>
    </main>
  );
}
