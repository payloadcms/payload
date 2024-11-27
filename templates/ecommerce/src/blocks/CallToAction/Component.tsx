import React from 'react'
import { RichText } from '@/components/RichText'

import type { Page, CallToActionBlock as CallToActionBlockProps } from '@/payload-types'

import { CMSLink } from '@/components/Link'

export const CallToActionBlock: React.FC<
  CallToActionBlockProps & {
    id?: string
  }
> = ({ links, richText }) => {
  return (
    <div className="container">
      <div className="bg-card rounded border-border border p-4 flex flex-col gap-8 md:flex-row md:justify-between md:items-center">
        <div className="max-w-[48rem] flex items-center">
          <RichText className="" content={richText} enableGutter={false} />
        </div>
        <div className="flex flex-col gap-8">
          {(links || []).map(({ link }, i) => {
            return <CMSLink key={i} size="lg" {...link} />
          })}
        </div>
      </div>
    </div>
  )
}
