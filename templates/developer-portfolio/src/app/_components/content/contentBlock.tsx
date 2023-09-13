import { FC } from 'react'

import { Block, BlockProps } from '../ui/block'
import { PayloadLink, PayloadLinkType } from './link'
import { RichText } from './richText'

interface ContentBlockFields extends BlockProps {
  richText?: unknown
  enableLink?: boolean
  link?: PayloadLinkType
}

interface ContentBlockProps {
  contentFields: ContentBlockFields[]
}

export const ContentBlock: FC<ContentBlockProps> = ({ contentFields }) => {
  return (
    <>
      {contentFields.map(({ richText, size, id, enableLink, link }) => {
        let content = <RichText content={richText} />

        if (enableLink) {
          content = <PayloadLink link={link}>{content}</PayloadLink>
        }

        return (
          <Block size={size} key={id} asChild={enableLink}>
            {content}
          </Block>
        )
      })}
    </>
  )
}
