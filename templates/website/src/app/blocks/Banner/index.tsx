import { cn } from '@/utilities/cn'
import React from 'react'
import RichText from 'src/app/components/RichText'

type Props = {
  className?: string
  content?: any
}

export const BannerBlock: React.FC<Props> = ({ className, content }) => {
  return (
    <div className={cn('mx-auto w-full', className)}>
      <div className="border border-border rounded bg-card py-3 px-6 flex items-center">
        <RichText
          className="classes.richText"
          content={content}
          enableGutter={false}
          enableProse={false}
        />
      </div>
    </div>
  )
}
