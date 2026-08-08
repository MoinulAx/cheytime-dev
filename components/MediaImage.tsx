"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/**
 * A photograph with a loading state.
 *
 * Panels open instantly but their images arrive over the network a moment
 * later, so the panel used to render as an empty bordered box that then
 * snapped to a picture. This holds a quiet pulse in that space and fades the
 * image in when it decodes, so the gap reads as loading rather than broken.
 *
 * `quality` is raised from Next's default of 75. These are dark, low-contrast
 * photographs, and JPEG artefacts in shadow are exactly what "blurry" looks
 * like on this palette — the extra weight is worth it on a handful of images.
 *
 * Not a blur-up placeholder: that needs a base64 `blurDataURL` per image, and
 * these come from a CMS where nobody is going to generate one.
 */
export default function MediaImage({
  className = "",
  quality = 90,
  onLoad,
  // Destructured rather than left in the spread so the a11y lint can see it —
  // and so a missing alt is a type error here rather than a silent omission.
  alt,
  ...props
}: ImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {/* Sits behind the image and is covered once it paints. `motion-reduce`
          stops the pulse for anyone who asked for less movement. */}
      {!loaded && (
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-bone-100/[0.04] motion-reduce:animate-none"
        />
      )}
      <Image
        {...props}
        alt={alt}
        quality={quality}
        className={`${className} transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
      />
    </>
  );
}
