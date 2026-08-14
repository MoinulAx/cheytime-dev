import type { Metadata } from "next";
import BackStack from "@/components/BackStack";
import { GalleryBlock } from "@/components/SectionContent";
import { getSections } from "@/lib/sections";

/** Same window as the clock, so an edit surfaces on both within the minute. */
export const revalidate = 60;

// Bare title: the root layout's template appends " · Chey Time".
export const metadata: Metadata = {
  title: "Gallery",
  description: "Every photograph, in one place.",
};

/**
 * Gallery in full, one level down from hour IX.
 *
 * Reads through `getSections()` rather than calling a loader directly, so this
 * page and the panel resolve identical content: same fallbacks, same chrome
 * from `site_sections`, same adaptation. The panel passes a `limit` and this
 * does not, that is the only difference between them.
 */
export default async function GalleryPage() {
  const sections = await getSections();
  const section = sections.find((s) => s.id === "gallery");
  if (!section || section.data.kind !== "gallery") return null;

  const { data } = section;

  return (
    <>
      {/* Up to the clock, with this panel reopened. */}
      <BackStack href="/#gallery" label="Back to the clock" />

      <header className="mb-10">
        <h1 className="font-display text-5xl font-bold leading-none text-bone-50 md:text-6xl">
          {section.title}
        </h1>
        <p className="mt-2 font-display text-lg italic text-bone-400">
          {section.subtitle}
        </p>
      </header>

      <GalleryBlock
        description={data.description}
        images={data.images}
        links={data.links}
      />
    </>
  );
}
