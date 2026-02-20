"use client";

import { useState } from "react";
import { sanitizeImageUrl } from "@/lib/validation";

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  fallback?: string;
  className?: string;
  onError?: () => void;
}

/**
 * SafeImage component that validates and sanitizes image URLs before rendering.
 * Falls back to a placeholder image if the URL is invalid or fails to load.
 */
export default function SafeImage({
  src,
  alt,
  fallback = "/placeholder-produce.png",
  className = "",
  onError,
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  // Sanitize the URL
  const safeSrc = hasError ? fallback : sanitizeImageUrl(src, fallback);

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <img
      src={safeSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
}
