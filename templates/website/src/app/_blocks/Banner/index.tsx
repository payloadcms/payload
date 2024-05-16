import React from 'react'
import RichText from 'src/app/_components/RichText'

import classes from './index.module.scss'

type Props = {
  content?: any
}

export const BannerBlock: React.FC<Props> = ({ content }) => {
  return (
    <div className={classes.container}>
      <div className={classes.content}>
        <RichText className={classes.richText} content={content} enableGutter={false} />
      </div>
    </div>
  )
}
