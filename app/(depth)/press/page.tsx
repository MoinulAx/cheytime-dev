import type { Metadata } from "next";
import BackStack from "@/components/BackStack";
import { PressBlock } from "@/components/SectionContent";
import { getSections } from "@/lib/sections";

/** Same window as the clock, so an edit surfaces on both within the minute. */
export const revalidate = 60;

// Bare title: the root layout's template appends " · Chey Time".
export const metadata: Metadata = {
  title: "Press",
  description: "Where the work has been written about.",
};

/**
 * Press in full — one level down from hour XI.
 *
 * Reads through `getSections()` rather than calling a loader directly, so this
 * page and the panel resolve identical content: same fallbacks, same chrome
 * from `site_sections`, same adaptation. The panel passes a `limit` and this
 * does not — that is the only difference between them.
 */
export default async function PressPage() {
  const sections = await getSections();
  const section = sections.find((s) => s.id === "press");
  if (!section || section.data.kind !== "press") return null;

  const { data } = section;

  return (
    <>
      {/* Up to the clock, with this panel reopened. */}
      <BackStack href="/#press" label="Back to the clock" />

      <header className="mb-10">
        <h1 className="font-display text-5xl font-bold leading-none text-bone-50 md:text-6xl">
          {section.title}
        </h1>
        <p className="mt-2 font-display text-lg italic text-bone-400">
          {section.subtitle}
        </p>
      </header>

      <PressBlock
        description={data.description}
        features={data.features}
        affiliations={data.affiliations}
        emptyMessage={data.emptyMessage}
      />
    </>
  );
}
