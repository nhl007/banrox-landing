import AloneVsTogether from "@/components/AloneVsTogether";
import Hero from "@/components/Hero";
import HowSquadWorks from "@/components/HowSquadWorks";
import IntelligenceLayer from "@/components/IntelligenceLayer";
import SquadApproves from "@/components/SquadApproves";
import SquadInvitation from "@/components/SquadInvitation";

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <AloneVsTogether />
      <SquadApproves />
      <HowSquadWorks />
      <IntelligenceLayer />
      <SquadInvitation />
    </main>
  );
}
