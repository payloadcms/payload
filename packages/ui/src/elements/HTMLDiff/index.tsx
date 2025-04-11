import React from 'react'

import { HtmlDiff } from './diff/index.js'
import './index.scss'

const baseClass = 'html-diff'

export const getHTMLDiffComponents = ({
  fromHTML,
  toHTML,
  tokenizeByCharacter,
}: {
  fromHTML: string
  toHTML: string
  tokenizeByCharacter?: boolean
}): {
  From: React.ReactNode
  To: React.ReactNode
} => {
  const diffHTML = new HtmlDiff(fromHTML, toHTML, {
    tokenizeByCharacter,
  })

  const [oldHTML, newHTML] = diffHTML.getSideBySideContents()

  const From = oldHTML ? (
    <div
      className={`${baseClass}__diff-old html-diff`}
      dangerouslySetInnerHTML={{ __html: oldHTML }}
    />
  ) : null

  const To = newHTML ? (
    <div
      className={`${baseClass}__diff-new html-diff`}
      dangerouslySetInnerHTML={{ __html: newHTML }}
    />
  ) : null

  return { From, To }
}
