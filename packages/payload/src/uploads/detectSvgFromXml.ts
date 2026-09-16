/**
 * Securely detect if an XML buffer contains a valid SVG document
 */
export function detectSvgFromXml(buffer: Buffer): boolean {
  try {
    // Limit buffer size to prevent processing large malicious files
    const maxSize = 2048
    const content = buffer.toString('utf8', 0, Math.min(buffer.length, maxSize))

    // Check for XML declaration and extract encoding if present
    const xmlDeclMatch = content.match(/^<\?xml[^>]*encoding=["']([^"']+)["']/i)
    const declaredEncoding = xmlDeclMatch?.[1]?.toLowerCase()

    // Only support safe encodings
    if (declaredEncoding && !['ascii', 'utf-8', 'utf8'].includes(declaredEncoding)) {
      return false
    }

    // Remove XML declarations, comments, and processing instructions
    let cleanContent = content
      .replace(/<\?xml[^>]*\?>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<\?[^>]*\?>/g, '')
      .trim()

    // Only allow a well-formed DOCTYPE for the SVG root without an internal subset.
    if (cleanContent.startsWith('<!DOCTYPE')) {
      let doctypeEndIndex = -1
      let hasInternalSubset = false
      let quoteCharacter: "'" | '"' | undefined

      for (let index = 0; index < cleanContent.length; index++) {
        const character = cleanContent[index]

        if (quoteCharacter) {
          if (character === quoteCharacter) {
            quoteCharacter = undefined
          }
          continue
        }

        if (character === '"' || character === "'") {
          quoteCharacter = character
        } else if (character === '[') {
          hasInternalSubset = true
        } else if (character === '>') {
          doctypeEndIndex = index
          break
        }
      }

      if (doctypeEndIndex === -1 || hasInternalSubset) {
        return false
      }

      const doctypeDeclaration = cleanContent.slice(0, doctypeEndIndex + 1)
      if (!isSupportedSvgDoctype({ declaration: doctypeDeclaration })) {
        return false
      }

      cleanContent = cleanContent.slice(doctypeEndIndex + 1).trim()
    }

    // Find the first actual element (root element)
    const rootElementMatch = cleanContent.match(/^<(\w+)(?:\s|>)/)
    if (!rootElementMatch || rootElementMatch[1] !== 'svg') {
      return false
    }

    const rootTagEndIndex = findUnquotedClosingBracket({ value: cleanContent })
    if (rootTagEndIndex === -1) {
      return false
    }

    const rootTag = cleanContent.slice(0, rootTagEndIndex + 1)
    if (!hasSvgNamespaceDeclaration({ rootTag })) {
      return false
    }

    return true
  } catch (_error) {
    // If any error occurs during parsing, treat as not SVG
    return false
  }
}

function findUnquotedClosingBracket({ value }: { value: string }): number {
  let quoteCharacter: "'" | '"' | undefined

  for (let index = 0; index < value.length; index++) {
    const character = value[index]

    if (quoteCharacter) {
      if (character === quoteCharacter) {
        quoteCharacter = undefined
      }
      continue
    }

    if (character === '"' || character === "'") {
      quoteCharacter = character
    } else if (character === '>') {
      return index
    }
  }

  return -1
}

function hasSvgNamespaceDeclaration({ rootTag }: { rootTag: string }): boolean {
  const xmlWhitespaceRegex = /[\t\n\r ]/
  let hasSvgNamespace = false
  let index = '<svg'.length

  while (index < rootTag.length) {
    while (xmlWhitespaceRegex.test(rootTag[index] ?? '')) {
      index++
    }

    if (rootTag[index] === '>') {
      return hasSvgNamespace
    }

    if (rootTag[index] === '/' && rootTag[index + 1] === '>') {
      return hasSvgNamespace
    }

    const attributeNameStart = index
    while (index < rootTag.length && !/[\t\n\r =/>]/.test(rootTag[index] ?? '')) {
      index++
    }

    if (attributeNameStart === index) {
      return false
    }

    const attributeName = rootTag.slice(attributeNameStart, index)

    while (xmlWhitespaceRegex.test(rootTag[index] ?? '')) {
      index++
    }

    if (rootTag[index] !== '=') {
      return false
    }

    index++
    while (xmlWhitespaceRegex.test(rootTag[index] ?? '')) {
      index++
    }

    const quoteCharacter = rootTag[index]
    if (quoteCharacter !== '"' && quoteCharacter !== "'") {
      return false
    }

    const attributeValueStart = ++index
    while (index < rootTag.length && rootTag[index] !== quoteCharacter) {
      index++
    }

    if (index >= rootTag.length) {
      return false
    }

    const attributeValue = rootTag.slice(attributeValueStart, index)
    index++

    if (attributeName === 'xmlns') {
      if (hasSvgNamespace || attributeValue !== 'http://www.w3.org/2000/svg') {
        return false
      }

      hasSvgNamespace = true
    }
  }

  return false
}

function isSupportedSvgDoctype({ declaration }: { declaration: string }): boolean {
  const declarationBody = declaration.slice('<!DOCTYPE'.length, -1).trim()
  if (declarationBody === 'svg') {
    return true
  }

  if (!/^svg\s/.test(declarationBody)) {
    return false
  }

  const externalIdentifier = declarationBody.slice('svg'.length).trimStart()
  if (/^SYSTEM\s/.test(externalIdentifier)) {
    const remaining = consumeQuotedLiteral({ value: externalIdentifier.slice('SYSTEM'.length) })

    return remaining !== undefined && remaining.trim() === ''
  }

  if (/^PUBLIC\s/.test(externalIdentifier)) {
    const afterPublicIdentifier = consumeQuotedLiteral({
      value: externalIdentifier.slice('PUBLIC'.length),
    })
    if (afterPublicIdentifier === undefined || !/^\s/.test(afterPublicIdentifier)) {
      return false
    }

    const remaining = consumeQuotedLiteral({ value: afterPublicIdentifier })

    return remaining !== undefined && remaining.trim() === ''
  }

  return false
}

function consumeQuotedLiteral({ value }: { value: string }): string | undefined {
  const trimmedValue = value.trimStart()
  const quoteCharacter = trimmedValue[0]

  if (quoteCharacter !== '"' && quoteCharacter !== "'") {
    return undefined
  }

  const closingQuoteIndex = trimmedValue.indexOf(quoteCharacter, 1)
  if (closingQuoteIndex === -1) {
    return undefined
  }

  return trimmedValue.slice(closingQuoteIndex + 1)
}
