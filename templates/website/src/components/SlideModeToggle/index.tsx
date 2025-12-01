'use client'

import React from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Presentation, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const SlideModeToggle: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isSlideMode = searchParams.get('mode') === 'slides'

  const toggleSlideMode = () => {
    const params = new URLSearchParams(searchParams.toString())

    if (isSlideMode) {
      params.delete('mode')
    } else {
      params.set('mode', 'slides')
    }

    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.push(newUrl)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleSlideMode}
      className="fixed top-20 right-4 z-40 bg-background/80 backdrop-blur-sm"
      aria-label={isSlideMode ? 'Exit slide mode' : 'Enter slide mode'}
    >
      {isSlideMode ? (
        <>
          <LayoutGrid className="h-4 w-4 mr-2" />
          Normal View
        </>
      ) : (
        <>
          <Presentation className="h-4 w-4 mr-2" />
          Slide View
        </>
      )}
    </Button>
  )
}
