import React from 'react'
import RichText from 'src/app/components/RichText'

import type { Page } from '../../../payload-types'

import { CMSLink } from '../../components/Link'

type Props = Extract<Page['layout'][0], { blockType: 'cta' }>

export const CallToActionBlock: React.FC<
  Props & {
    id?: string
  }
> = ({ links, richText }) => {
  return (
    <div className="container">
      <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center">
        <div className="max-w-[48rem] mb-8">
          <RichText className="classes.richText" content={richText} enableGutter={false} />
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
