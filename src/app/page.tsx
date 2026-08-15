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
        The deck. Above the gate these seven are not a column — they are one
        window, stacked, and a scroll gesture hands the window from one to the
        next rather than moving the page. See .scene in globals.css and the
        controller in scroll/ScrollSequence.tsx. Below the gate the wrapper does
        nothing and they are an ordinary column again.
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
