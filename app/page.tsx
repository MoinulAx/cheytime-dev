import CosmicBackground from "@/components/CosmicBackground";
import CheysClock from "@/components/CheysClock";
import { getSections } from "@/lib/sections";

/**
 * Incremental Static Regeneration: the page is served from cache and rebuilt at
 * most once a minute. First paint stays fast (the clock is heavy) while an edit
 * made in the legacy Admin panel appears within the window.
 */
export const revalidate = 60;

/**
 * Home — the entire experience is the clock. This server component resolves the
 * live section content, renders the static cosmic backdrop and mounts the
 * client-only interactive clock, keeping everything but the interaction
 * server-rendered.
 */
export default async function Home() {
  const sections = await getSections();

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <CosmicBackground />
      <CheysClock sections={sections} />
    </main>
  );
}
