'use client'

import { FC, useState } from 'react'
import Image from 'next/image'

import { cn } from '../../../utilities'
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog'

interface MediaDialogProps {
  className?: string
  mediaFit?: 'contain' | 'cover'
  triggerContent: React.ReactNode
  caption?: React.ReactNode
  mediaInfo: {
    id: string
    url?: string
    alt?: string
    width?: number
    height?: number
  }
}

export const MediaDialog: FC<MediaDialogProps> = ({
  className,
  mediaFit,
  triggerContent,
  caption,
  mediaInfo,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger
        className={cn(className, 'first:mt-8 first:md:mt-12 first:lg:mt-0 mb-1 lg:mb-0')}
      >
        {triggerContent}
        {mediaFit === 'contain' && caption}
      </DialogTrigger>
      {mediaFit === 'cover' && caption}
      <DialogContent
        onClick={() => setDialogOpen(false)}
        showCloseButton
        variant="fullscreen"
        className="flex justify-center flex-col gap-2 items-start"
        style={{
          maxHeight: `${mediaInfo.height}px`,
          maxWidth: `${mediaInfo.width}px`,
        }}
      >
        <div
          className="w-full h-full relative "
          style={{
            maxWidth: `${mediaInfo.width}px`,
            height: `min(${(mediaInfo.height / mediaInfo.width) * 100}vw, 80vh)`,
          }}
        >
          <Image
            id={`${mediaInfo.id}-lightbox`}
            className="object-contain"
            src={mediaInfo.url}
            alt={mediaInfo.alt}
            fill
            sizes="90vw"
          />
        </div>
        {mediaInfo.alt && (
          <div
            className="w-full text-center pl-2 sm:pl-0 text-primary text-sm lg:text-xl"
            style={{ maxWidth: `${mediaInfo.width}px` }}
          >
            {mediaInfo.alt}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
