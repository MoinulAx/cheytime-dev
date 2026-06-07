import CosmicBackground from "@/components/CosmicBackground";
import CheysClock from "@/components/CheysClock";

/**
 * Home — the entire experience is the clock. This server component renders the
 * static cosmic backdrop and mounts the client-only interactive clock, keeping
 * everything but the interaction server-rendered.
 */
export default function Home() {
  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <CosmicBackground />
      <CheysClock />
    </main>
  );
}
