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
    const cleanContent = content
      .replace(/<\?xml[^>]*\?>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<\?[^>]*\?>/g, '')
      .trim()

    // Find the first actual element (root element)
    const rootElementMatch = cleanContent.match(/^<(\w+)(?:\s|>)/)
    if (!rootElementMatch || rootElementMatch[1] !== 'svg') {
      return false
    }

    // Validate SVG namespace - must be present for valid SVG
    const svgNamespaceRegex = /xmlns=["']http:\/\/www\.w3\.org\/2000\/svg["']/
    if (!svgNamespaceRegex.test(content)) {
      return false
    }

    // Additional validation: ensure it's not malformed
    const svgOpenTag = content.match(/<svg[\s>]/)
    if (!svgOpenTag) {
      return false
    }

    return true
  } catch (_error) {
    // If any error occurs during parsing, treat as not SVG
    return false
  }
}
