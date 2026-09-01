import { notFound } from "next/navigation";
import WorldSectionPage from "@/components/home/WorldSectionPage";
import { ACTIVE_WORLDS, isActiveWorld } from "@/lib/worldContent";

export function generateStaticParams() {
  return ACTIVE_WORLDS.map((world) => ({ world }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ world: string }>;
}) {
  const { world } = await params;
  if (!isActiveWorld(world)) notFound();
  return <WorldSectionPage world={world} section="pricing" />;
}
