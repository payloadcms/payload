'use client'

import React from 'react'
import { cn } from '@/utilities/ui'

export interface SlideIndicatorsProps {
  totalSlides: number
  currentSlide: number
  onSlideClick: (index: number) => void
  className?: string
}

export const SlideIndicators: React.FC<SlideIndicatorsProps> = ({
  totalSlides,
  currentSlide,
  onSlideClick,
  className,
}) => {
  return (
    <div className={cn('fixed bottom-24 left-1/2 -translate-x-1/2 z-50', className)}>
      <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            onClick={() => onSlideClick(index)}
            className={cn(
              'w-2 h-2 rounded-full transition-all duration-300',
              currentSlide === index
                ? 'bg-primary w-8'
                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50',
            )}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={currentSlide === index ? 'true' : 'false'}
          />
        ))}
      </div>
    </div>
  )
}
