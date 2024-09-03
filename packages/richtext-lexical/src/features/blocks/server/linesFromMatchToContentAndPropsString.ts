export function linesFromStartToContentAndPropsString({
  endLineIndex,
  isEndOptional,
  lines,
  linesLength,
  regexpEndRegex,
  startLineIndex,
  startMatch,
}: {
  endLineIndex: number
  isEndOptional?: boolean
  lines: string[]
  linesLength: number
  regexpEndRegex?: RegExp
  startLineIndex: number
  startMatch: RegExpMatchArray
}): {
  content: string
  endLineIndex: number
  propsString: string
} {
  const openedSubStartMatches = 0

  let propsString = ''
  let content = ''
  const linesCopy = [...lines]

  const isWithinProp = false
  let isWithinContent = false
  let contentSubStartMatchesAmount = 0

  let bracketCount = 0
  let quoteChar = null
  let isSelfClosing = false
  let isWithinCodeBlockAmount = 0

  mainLoop: for (let lineIndex = startLineIndex; lineIndex < linesLength; lineIndex++) {
    const line = linesCopy[lineIndex].trim()

    let charIndex = 0

    if (lineIndex === startLineIndex) {
      charIndex = startMatch.index + startMatch[0].length
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

          break mainLoop
        } else if (char === '>' && bracketCount === 0 && !quoteChar) {
          if (charIndex === line.length - 1) {
            isWithinContent = true
            charIndex++
            continue
          } else {
            isWithinContent = true
            content += line.slice(charIndex + 1) + '\n'
            break
          }
        }

        propsString += char
      } else {
        if (char === '`') {
          isWithinCodeBlockAmount++
        }

        if (isWithinCodeBlockAmount % 2 === 0) {
          if (char === '<' && line.slice(charIndex).startsWith('</')) {
            contentSubStartMatchesAmount--
            if (contentSubStartMatchesAmount < 0) {
              content = content.slice(0, -1) // Remove the last newline
              endLineIndex = lineIndex
              break mainLoop
            }
          } else if (char === '<' && !line.slice(charIndex).startsWith('</')) {
            contentSubStartMatchesAmount++
          }
        }

        content += char
      }

      charIndex++
    }

    if (isWithinContent) {
      content += '\n'
    } else {
      propsString += '\n'
    }

    if (regexpEndRegex && regexpEndRegex.test(line)) {
      endLineIndex = lineIndex
      break
    }

    if (lineIndex === linesLength - 1 && !isEndOptional && !isSelfClosing) {
      throw new Error('End match not found')
    }
  }

  // Replace all \n with spaces
  propsString = propsString.replace(/\n/g, ' ').trim()
  //console.log('Result:', { content, endLineIndex, lines, propsString })

  return { content, endLineIndex, propsString }
}
