import React from 'react'
import { Gutter } from 'src/app/_components/Gutter'

import styles from './index.module.scss'
import { serializeLexical } from './serialize'

const RichText: React.FC<{ className?: string; content: any }> = ({ className, content }) => {
  if (!content) {
    return null
  }

  return (
    <Gutter>
      <div className={[className].filter(Boolean).join(' ')}>
        {content &&
          !Array.isArray(content) &&
          typeof content === 'object' &&
          'root' in content &&
          serializeLexical({ nodes: content?.root?.children })}
      </div>
    </Gutter>
  )
}

export default RichText
