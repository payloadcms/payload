export function linesFromStartToContentAndPropsString({
  isEndOptional,
  lines,
  regexpEndRegex,
  startLineIndex,
  startMatch,
  trimChildren,
}: {
  isEndOptional?: boolean
  lines: string[]
  regexpEndRegex?: RegExp
  startLineIndex: number
  startMatch: RegExpMatchArray
  trimChildren?: boolean
}): {
  /**
   * The matched string after the end match, in the same line as the end match. Useful for inline matches.
   */
  afterEndLine: string
  /**
   * The matched string before the start match, in the same line as the start match. Useful for inline matches.
   */
  beforeStartLine: string
  content: string
  endLineIndex: number
  endlineLastCharIndex: number
  propsString: string
} {
  let propsString = ''
  let content = ''
  const linesCopy = lines.slice(startLineIndex)

  let isWithinContent = false // If false => is within prop
  let contentSubTagStartAmount = 0

  let bracketCount = 0
  let quoteChar: null | string = null
  let isSelfClosing = false
  let isWithinCodeBlockAmount = 0

  const beforeStartLine = linesCopy[0]!.slice(0, startMatch.index)
  let endlineLastCharIndex = 0

  let endLineIndex = startLineIndex

  mainLoop: for (const [lineIndex, lineCopy] of linesCopy.entries()) {
    const line = trimChildren ? lineCopy.trim() : lineCopy
    let amountOfBeginningSpacesRemoved = 0
    if (trimChildren) {
      for (let i = 0; i < lineCopy.length; i++) {
        if (lineCopy[i] === ' ') {
          amountOfBeginningSpacesRemoved++
        } else {
          break
        }
      }
    }

    let charIndex = 0

    if (lineIndex === 0) {
      charIndex = (startMatch.index ?? 0) + startMatch[0].length - amountOfBeginningSpacesRemoved // We need to also loop over the ">" in something like "<InlineCode>" in order to later set isWithinContent to true
    }

    while (charIndex < line.length) {
      const char = line[charIndex]
      const nextChar = line[charIndex + 1]

      if (!isWithinContent) {
        if (char === '{' && !quoteChar) {
          bracketCount++
        } else if (char === '}' && !quoteChar) {
          bracketCount--
        } else if ((char === '"' || char === "'") && !quoteChar) {
          quoteChar = char
        } else if (char === quoteChar) {
          quoteChar = null
        }

        if (char === '/' && nextChar === '>' && bracketCount === 0 && !quoteChar) {
          isSelfClosing = true
          endLineIndex = lineIndex
          endlineLastCharIndex = charIndex + 2

          break mainLoop
        } else if (char === '>' && bracketCount === 0 && !quoteChar) {
          isWithinContent = true
          charIndex++
          continue
        }

        propsString += char
      } else {
        if (char === '`') {
          isWithinCodeBlockAmount++
        }

        if (isWithinCodeBlockAmount % 2 === 0) {
          if (char === '<' && nextChar === '/') {
            contentSubTagStartAmount--

            if (contentSubTagStartAmount < 0) {
              if (content[content.length - 1] === '\n') {
                content = content.slice(0, -1) // Remove the last newline
              }
              endLineIndex = lineIndex
              // Calculate endlineLastCharIndex by finding ">" in line
              for (let i = charIndex; i < line.length; i++) {
                if (line[i] === '>') {
                  endlineLastCharIndex = i + 1

                  break
                }
              }
              break mainLoop
            }
          } else if (char === '/' && nextChar === '>') {
            contentSubTagStartAmount--

            if (contentSubTagStartAmount < 0) {
              if (content[content.length - 1] === '\n') {
                content = content.slice(0, -1) // Remove the last newline
              }
              endLineIndex = lineIndex
              endlineLastCharIndex = charIndex + 2
              break mainLoop
            }
          } else if (char === '<' && nextChar !== '/') {
            contentSubTagStartAmount++
          }
        }

        content += char
      }

      charIndex++
    }

    if (isWithinContent) {
      if (content?.length > 0 && lineIndex > 0) {
        content += '\n'
      }
    } else {
      propsString += '\n'
    }

    if (regexpEndRegex && contentSubTagStartAmount < 0) {
      // If 0 and in same line where it got lowered to 0 then this is not the match we are looking for
      const match = line.match(regexpEndRegex)
      if (match?.index !== undefined) {
        endLineIndex = lineIndex
        endlineLastCharIndex = match.index + match[0].length - 1
        break
      }
    }

    if (lineIndex === linesCopy.length - 1 && !isEndOptional && !isSelfClosing) {
      throw new Error(
        'End match not found for lines ' +
          lines.join('\n') +
          '\n\n. Start match: ' +
          JSON.stringify(startMatch),
      )
    }
  }

  const afterEndLine = linesCopy[endLineIndex]!.trim().slice(endlineLastCharIndex)

  return {
    afterEndLine,
    beforeStartLine,
    content,
    endLineIndex: startLineIndex + endLineIndex,
    endlineLastCharIndex,
    propsString,
  }
}
