import type { ElementType, Ref } from 'react'
import type { StaticImageData } from 'next/image'

import type { Media as MediaType } from '@/payload-types'

export interface Props {
  alt?: string
  className?: React.HTMLProps<HTMLElement>['className']
  fill?: boolean // for NextImage only
  htmlElement?: ElementType | null
  pictureClassName?: React.HTMLProps<HTMLElement>['className']
  imgClassName?: React.HTMLProps<HTMLElement>['className']
  onClick?: () => void
  onLoad?: () => void
  loading?: 'lazy' | 'eager' // for NextImage only
  priority?: boolean // for NextImage only
  ref?: Ref<HTMLImageElement | HTMLVideoElement | null>
  resource?: MediaType | string | number | null // for Payload media
  size?: string // for NextImage only
  src?: StaticImageData // for static media
  videoClassName?: string
}
