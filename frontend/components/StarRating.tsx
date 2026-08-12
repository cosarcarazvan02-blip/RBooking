'use client';

import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  totalReviews?: number;
  className?: string;
  starClassName?: string;
}

export default function StarRating({
  rating,
  maxStars = 5,
  size = 'sm',
  showNumber = false,
  totalReviews,
  className = '',
  starClassName = '',
}: StarRatingProps) {
  const normalizedRating = Math.max(0, Math.min(maxStars, Number(rating) || 0));

  const sizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const currentSize = sizeMap[size] || sizeMap.sm;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="inline-flex items-center gap-0.5" aria-label={`Rating: ${normalizedRating.toFixed(1)} din ${maxStars}`}>
        {Array.from({ length: maxStars }).map((_, index) => {
          const fillPercentage = Math.max(0, Math.min(100, (normalizedRating - index) * 100));

          return (
            <div key={index} className={`relative inline-flex items-center justify-center shrink-0 ${currentSize}`}>
              {/* Background empty star */}
              <Star
                className={`${currentSize} text-neutral-300 dark:text-neutral-700 stroke-[1.5] ${starClassName}`}
              />

              {/* Foreground filled partial star with precise clip */}
              {fillPercentage > 0 && (
                <div
                  className="absolute inset-0 overflow-hidden text-amber-500 pointer-events-none"
                  style={{ width: `${fillPercentage}%` }}
                >
                  <Star
                    className={`${currentSize} fill-amber-500 text-amber-500 stroke-[1.5] ${starClassName}`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showNumber && (
        <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
          {normalizedRating.toFixed(1)}
        </span>
      )}

      {totalReviews !== undefined && (
        <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
          ({totalReviews})
        </span>
      )}
    </div>
  );
}
