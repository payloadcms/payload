import React from 'react'

import { HtmlDiff } from './diff/index.js'
import './colors.css'
import './index.css'

export { escapeDiffHTML, unescapeDiffHTML } from './escapeHtml.js'

const baseClass = 'html-diff'

export const getHTMLDiffComponents = ({
  fromHTML,
  fromLabel,
  postProcess,
  toHTML,
  tokenizeByCharacter,
  toLabel,
}: {
  fromHTML: string
  fromLabel?: string
  /**
   * Optional function to transform the HTML output after diffing.
   * Useful for converting escape sequences to HTML entities.
   */
  postProcess?: (html: string) => string
  toHTML: string
  tokenizeByCharacter?: boolean
  toLabel?: string
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
      aria-label={fromLabel}
      className={`${baseClass}__diff-old html-diff`}
      dangerouslySetInnerHTML={{ __html: oldHTML }}
      role={fromLabel ? 'group' : undefined}
    />
  ) : null

  const To = newHTML ? (
    <div
      aria-label={toLabel}
      className={`${baseClass}__diff-new html-diff`}
      dangerouslySetInnerHTML={{ __html: newHTML }}
      role={toLabel ? 'group' : undefined}
    />
  ) : null

  return { From, To }
}
