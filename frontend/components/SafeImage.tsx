'use client';

import React, { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

export const NO_PHOTO_PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='800' height='600' fill='%23181b22'/><rect x='340' y='210' width='120' height='100' rx='12' fill='%23242a38'/><circle cx='375' cy='245' r='12' fill='%2394a3b8'/><path d='M352 300l30-28 25 18 28-30 25 22v18H352z' fill='%23475569'/><text x='400' y='360' font-family='sans-serif' font-size='16' font-weight='600' fill='%23cbd5e1' text-anchor='middle'>Fără Fotografie / No Photo</text><text x='400' y='385' font-family='sans-serif' font-size='12' font-weight='500' fill='%2364748b' text-anchor='middle'>RBooking Hospitality</text></svg>";

interface SafeImageProps extends Omit<ImageProps, 'src'> {
  src?: string | null;
  fallbackSrc?: string;
}

export default function SafeImage({
  src,
  fallbackSrc = NO_PHOTO_PLACEHOLDER,
  alt,
  ...props
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(() => {
    if (!src || !src.trim()) return fallbackSrc;
    return src;
  });

  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src || !src.trim()) {
      setImgSrc(fallbackSrc);
      setHasError(true);
    } else {
      setImgSrc(src);
      setHasError(false);
    }
  }, [src, fallbackSrc]);

  return (
    <Image
      {...props}
      src={hasError || !imgSrc ? fallbackSrc : imgSrc}
      alt={alt || 'Accommodation Image'}
      onError={() => {
        if (!hasError) {
          setHasError(true);
          setImgSrc(fallbackSrc);
        }
      }}
    />
  );
}
