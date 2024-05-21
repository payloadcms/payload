import React from 'react'

import type { Page } from '../../../payload-types'

import { CMSLink } from '../../components/Link'
import { Media } from '../../components/Media'
import RichText from '../../components/RichText'

export const MediumImpactHero: React.FC<Page['hero']> = (props) => {
  const { links, media, richText } = props

  return (
    <div className="classes.hero">
      <div className="classes.background">
        <RichText className="classes.richText" content={richText} enableGutter={false} />
        {Array.isArray(links) && (
          <ul className="classes.links">
            {links.map(({ link }, i) => {
              return (
                <li key={i}>
                  <CMSLink className="classes.link" {...link} />
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <div className="classes.media">
        {typeof media === 'object' && <Media className="classes.media" resource={media} />}
      </div>
    </div>
  )
}
