'use client'

import React from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'

export interface SlideControlsProps {
  currentSlide: number
  totalSlides: number
  onNext: () => void
  onPrev: () => void
  onExit: () => void
  isFirstSlide: boolean
  isLastSlide: boolean
  className?: string
}

export const SlideControls: React.FC<SlideControlsProps> = ({
  currentSlide,
  totalSlides,
  onNext,
  onPrev,
  onExit,
  isFirstSlide,
  isLastSlide,
  className,
}) => {
  return (
    <div className={cn('fixed inset-x-0 bottom-0 z-50', className)}>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {/* Previous Button */}
          <Button
            variant="outline"
            size="lg"
            onClick={onPrev}
            disabled={isFirstSlide}
            className="bg-background/80 backdrop-blur-sm"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Previous
          </Button>

          {/* Slide Counter */}
          <div className="flex items-center gap-4">
            <div className="bg-background/80 backdrop-blur-sm px-4 py-2 rounded-md border border-border">
              <span className="text-sm font-medium">
                {currentSlide + 1} / {totalSlides}
              </span>
            </div>

            {/* Exit Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={onExit}
              className="bg-background/80 backdrop-blur-sm"
              aria-label="Exit slide mode"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Next Button */}
          <Button
            variant="outline"
            size="lg"
            onClick={onNext}
            disabled={isLastSlide}
            className="bg-background/80 backdrop-blur-sm"
            aria-label="Next slide"
          >
            Next
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
