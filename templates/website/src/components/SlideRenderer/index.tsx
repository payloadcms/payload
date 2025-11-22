'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/utilities/ui'
import { useSlideNavigation } from './useSlideNavigation'
import { SlideControls } from './SlideControls'
import { SlideIndicators } from './SlideIndicators'

export interface SlideRendererProps {
  slides: React.ReactNode[]
  initialSlide?: number
  showIndicators?: boolean
  showControls?: boolean
  transition?: 'fade' | 'slide' | 'none'
  className?: string
}

export const SlideRenderer: React.FC<SlideRendererProps> = ({
  slides,
  initialSlide = 0,
  showIndicators = true,
  showControls = true,
  transition = 'fade',
  className,
}) => {
  const router = useRouter()
  const totalSlides = slides.length

  const { currentSlide, goToSlide, nextSlide, prevSlide, isFirstSlide, isLastSlide } =
    useSlideNavigation({
      totalSlides,
      initialSlide,
      loop: false,
    })

  const handleExit = () => {
    // Remove slide mode from URL
    const url = new URL(window.location.href)
    url.searchParams.delete('mode')
    router.push(url.pathname + url.search)
  }

  const getTransitionClasses = () => {
    switch (transition) {
      case 'fade':
        return 'transition-opacity duration-500'
      case 'slide':
        return 'transition-transform duration-500'
      case 'none':
      default:
        return ''
    }
  }

  return (
    <div className={cn('fixed inset-0 z-[100] bg-background overflow-hidden', className)}>
      {/* Slide Container */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => {
          const isActive = index === currentSlide

          return (
            <div
              key={index}
              className={cn(
                'absolute inset-0 w-full min-h-screen flex items-center justify-center p-8',
                getTransitionClasses(),
                {
                  'opacity-100 pointer-events-auto': isActive,
                  'opacity-0 pointer-events-none': !isActive,
                  'translate-x-0': isActive && transition === 'slide',
                  'translate-x-full': !isActive && index > currentSlide && transition === 'slide',
                  '-translate-x-full': !isActive && index < currentSlide && transition === 'slide',
                },
              )}
              aria-hidden={!isActive}
            >
              <div className="w-full max-w-7xl">{slide}</div>
            </div>
          )
        })}
      </div>

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
        />
      </div>

      {/* Slide Indicators */}
      {showIndicators && totalSlides > 1 && (
        <SlideIndicators
          totalSlides={totalSlides}
          currentSlide={currentSlide}
          onSlideClick={goToSlide}
        />
      )}

      {/* Navigation Controls */}
      {showControls && (
        <SlideControls
          currentSlide={currentSlide}
          totalSlides={totalSlides}
          onNext={nextSlide}
          onPrev={prevSlide}
          onExit={handleExit}
          isFirstSlide={isFirstSlide}
          isLastSlide={isLastSlide}
        />
      )}

      {/* Keyboard Hints */}
      <div className="fixed top-4 right-4 z-50 bg-background/80 backdrop-blur-sm px-3 py-2 rounded-md border border-border text-xs text-muted-foreground">
        <div className="flex gap-4">
          <span>← → Navigate</span>
          <span>ESC Exit</span>
        </div>
      </div>
    </div>
  )
}
