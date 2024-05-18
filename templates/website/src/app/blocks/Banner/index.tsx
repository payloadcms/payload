import React from 'react'
import RichText from 'src/app/components/RichText'

type Props = {
  content?: any
}

export const BannerBlock: React.FC<Props> = ({ content }) => {
  return (
    <div className="mx-auto max-w-[48.75rem] my-16">
      <div className="border border-border rounded-sm p-6 flex items-center">
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
