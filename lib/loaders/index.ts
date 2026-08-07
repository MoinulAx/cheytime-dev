/**
 * Server-side data loaders — one per DB-backed section.
 *
 * Every loader takes the section's static content as a fallback and returns the
 * exact `SectionData` variant the renderer already consumes. All adaptation
 * between the legacy schema and the union happens here, never in a component.
 */
export { loadMusic } from "./music";
export { loadStore } from "./store";
export { loadEvents } from "./events";
export { loadArchive } from "./archive";
export { loadPress } from "./press";
export { loadBlog } from "./blog";
export { loadDigital } from "./digital";
