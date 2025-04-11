import React from 'react'

import { HtmlDiff } from './diff.js'
import './index.scss'

const baseClass = 'html-diff'

export const getHTMLDiffComponents = ({
  fromHTML,
  toHTML,
}: {
  fromHTML: string
  toHTML: string
}): {
  From: React.ReactNode
  To: React.ReactNode
} => {
  const diffHTML = new HtmlDiff(fromHTML, toHTML)

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
