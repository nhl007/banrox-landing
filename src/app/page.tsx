import AloneVsTogether from "@/components/AloneVsTogether";
import EarlyAccess from "@/components/EarlyAccess";
import Hero from "@/components/Hero";
import HowSquadWorks from "@/components/HowSquadWorks";
import IntelligenceLayer from "@/components/IntelligenceLayer";
import LifeInsideSquad from "@/components/LifeInsideSquad";
import SquadApproves from "@/components/SquadApproves";
import SquadCardTrail from "@/components/SquadCardTrail";
import SquadInvitation from "@/components/SquadInvitation";

export default function Home() {
  return (
    <main className="flex-1">
      <SquadCardTrail />
      <div className="scene-track">
        <div className="scene">
          <Hero />
          <AloneVsTogether />
          <SquadApproves />
          <HowSquadWorks />
          <IntelligenceLayer />
          <LifeInsideSquad />
          <SquadInvitation />
          <EarlyAccess />
        </div>
      </div>
    </main>
  );
}
