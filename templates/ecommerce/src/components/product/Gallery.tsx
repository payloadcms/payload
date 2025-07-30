'use client'

import type { Media as MediaType } from '@/payload-types'

import { Media } from '@/components/Media'
import { GridTileImage } from '@/components/Grid/Tile'
import { useSearchParams } from 'next/navigation'
import React, { useEffect } from 'react'

import { Carousel, CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel'

export type GalleryImage = {
  image: MediaType
  variantID?: string
}

type Props = {
  gallery: GalleryImage[]
}

export const Gallery: React.FC<Props> = ({ gallery }) => {
  const searchParams = useSearchParams()
  const [current, setCurrent] = React.useState(0)
  const [api, setApi] = React.useState<CarouselApi>()

  useEffect(() => {
    if (!api) {
      return
    }
  }, [api])

  useEffect(() => {
    const variantID = searchParams.get('variant')

    if (variantID && api) {
      const index = gallery.findIndex((item) => item.variantID === variantID)
      if (index !== -1) {
        setCurrent(index)
        api.scrollTo(index, true)
      }
    }
  }, [searchParams, api, gallery])

  return (
    <div>
      <div className="relative w-full overflow-hidden mb-8">
        <Media
          resource={gallery[current].image}
          className="w-full"
          imgClassName="w-full rounded-lg"
        />
      </div>

      <Carousel setApi={setApi} className="w-full" opts={{ align: 'start', loop: false }}>
        <CarouselContent>
          {gallery.map((item, i) => (
            <CarouselItem
              className="basis-1/5"
              key={`${item.image.id}-${i}`}
              onClick={() => setCurrent(i)}
            >
              <GridTileImage active={i === current} media={item.image} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
