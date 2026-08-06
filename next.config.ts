import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // YouTube thumbnails used as poster frames in the Music section.
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      // Supabase Storage — the `site-assets` and `music-files` buckets back the
      // archive grid and any admin-uploaded imagery.
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
    // The cosmic backdrop is a self-authored SVG served through next/image.
    // (Placeholder atmosphere — swap for real photography when available.)
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
