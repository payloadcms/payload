import React from 'react'

import { HtmlDiff } from './diff/index.js'
import './index.scss'

export { escapeDiffHTML, unescapeDiffHTML } from './escapeHtml.js'

const baseClass = 'html-diff'

export const getHTMLDiffComponents = ({
  fromHTML,
  postProcess,
  toHTML,
  tokenizeByCharacter,
}: {
  fromHTML: string
  /**
   * Optional function to transform the HTML output after diffing.
   * Useful for converting escape sequences to HTML entities.
   */
  postProcess?: (html: string) => string
  toHTML: string
  tokenizeByCharacter?: boolean
}): {
  From: React.ReactNode
  To: React.ReactNode
} => {
  const diffHTML = new HtmlDiff(fromHTML, toHTML, {
    tokenizeByCharacter,
  })

  let [oldHTML, newHTML] = diffHTML.getSideBySideContents()

  if (postProcess) {
    oldHTML = postProcess(oldHTML)
    newHTML = postProcess(newHTML)
  }

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
