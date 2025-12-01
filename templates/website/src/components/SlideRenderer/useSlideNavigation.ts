'use client'

import { useCallback, useEffect, useState } from 'react'

export interface UseSlideNavigationProps {
  totalSlides: number
  initialSlide?: number
  loop?: boolean
  autoAdvance?: boolean
  autoAdvanceDelay?: number
}

export interface UseSlideNavigationReturn {
  currentSlide: number
  goToSlide: (index: number) => void
  nextSlide: () => void
  prevSlide: () => void
  isFirstSlide: boolean
  isLastSlide: boolean
}

export const useSlideNavigation = ({
  totalSlides,
  initialSlide = 0,
  loop = false,
  autoAdvance = false,
  autoAdvanceDelay = 5000,
}: UseSlideNavigationProps): UseSlideNavigationReturn => {
  const [currentSlide, setCurrentSlide] = useState(initialSlide)

  const goToSlide = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalSlides) {
        setCurrentSlide(index)
      }
    },
    [totalSlides],
  )

  const nextSlide = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1)
    } else if (loop) {
      setCurrentSlide(0)
    }
  }, [currentSlide, totalSlides, loop])

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1)
    } else if (loop) {
      setCurrentSlide(totalSlides - 1)
    }
  }, [currentSlide, totalSlides, loop])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault()
          nextSlide()
          break
        case 'ArrowLeft':
          e.preventDefault()
          prevSlide()
          break
        case 'Home':
          e.preventDefault()
          goToSlide(0)
          break
        case 'End':
          e.preventDefault()
          goToSlide(totalSlides - 1)
          break
        case 'Escape':
          e.preventDefault()
          // Exit slide mode by removing the mode parameter from URL
          const url = new URL(window.location.href)
          url.searchParams.delete('mode')
          window.location.href = url.pathname + url.search
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextSlide, prevSlide, goToSlide, totalSlides])

  // Auto-advance
  useEffect(() => {
    if (!autoAdvance) return

    const timer = setInterval(() => {
      nextSlide()
    }, autoAdvanceDelay)

    return () => clearInterval(timer)
  }, [autoAdvance, autoAdvanceDelay, nextSlide])

  // Touch/swipe support
  useEffect(() => {
    let touchStartX = 0
    let touchEndX = 0

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX
    }

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX
      handleSwipe()
    }

    const handleSwipe = () => {
      const swipeThreshold = 50
      if (touchStartX - touchEndX > swipeThreshold) {
        nextSlide()
      } else if (touchEndX - touchStartX > swipeThreshold) {
        prevSlide()
      }
    }

    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [nextSlide, prevSlide])

  const isFirstSlide = currentSlide === 0
  const isLastSlide = currentSlide === totalSlides - 1

  return {
    currentSlide,
    goToSlide,
    nextSlide,
    prevSlide,
    isFirstSlide,
    isLastSlide,
  }
}
