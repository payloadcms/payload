/**
 * Validate SVG content for security vulnerabilities
 * Detects and blocks malicious patterns commonly used in SVG-based attacks
 */
export function validateSvg(buffer: Buffer): boolean {
  try {
    const content = buffer.toString('utf8')

    // Dangerous patterns that should not be present in uploaded SVGs
    const dangerousPatterns = [
      // Script tags
      /<script[\s>]/i,
      /<\/script>/i,

      // Event handlers (onclick, onload, onerror, etc.)
      /\son\w+\s*=/i,

      // JavaScript URLs
      /javascript:/i,
      /data:text\/html/i,

      // Foreign objects (can embed HTML)
      /<foreignObject[\s>]/i,

      // Embedded iframes
      /<iframe[\s>]/i,

      // Embedded objects and embeds
      /<object[\s>]/i,
      /<embed[\s>]/i,

      // Base64 encoded scripts (common obfuscation technique)
      /data:image\/svg\+xml;base64,[\w+/]*PHNjcmlwdA/i, // <script in base64

      // XLink href with javascript (deprecated but still dangerous)
      /xlink:href\s*=\s*["']javascript:/i,

      // Import statements
      /@import/i,

      // External resource references that could be dangerous
      /<!ENTITY/i,
      /<!DOCTYPE[^>]*\[/i, // DOCTYPE with internal subset

      // Attempt to use CDATA to hide scripts
      /<!\[CDATA\[[\s\S]*<script/i,
    ]

    // Check for dangerous patterns
    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        return false
      }
    }

    // Additional validation: check for suspicious attribute combinations
    // Multiple event handlers or unusual nesting often indicates malicious intent
    const eventHandlerCount = (content.match(/\son\w+\s*=/gi) || []).length
    if (eventHandlerCount > 0) {
      return false
    }

    // Check for data URIs that might contain executable content
    const dataUriMatches = content.match(/data:[^;,]+/gi) || []
    for (const dataUri of dataUriMatches) {
      const mimeType = dataUri.toLowerCase()
      // Only allow safe image formats in data URIs
      if (
        !mimeType.includes('image/png') &&
        !mimeType.includes('image/jpeg') &&
        !mimeType.includes('image/jpg') &&
        !mimeType.includes('image/gif') &&
        !mimeType.includes('image/webp') &&
        !mimeType.includes('image/svg+xml')
      ) {
        return false
      }
    }

    // Validate that use/image hrefs don't point to dangerous protocols
    const hrefMatches = content.match(/(?:href|src|data|xlink:href)\s*=\s*["'][^"']+["']/gi) || []
    for (const hrefMatch of hrefMatches) {
      const hrefValue = hrefMatch.match(/["']([^"']+)["']/)?.[1]?.toLowerCase() || ''

      // Block dangerous protocols
      if (
        hrefValue.startsWith('javascript:') ||
        hrefValue.startsWith('data:text/html') ||
        hrefValue.startsWith('vbscript:') ||
        hrefValue.startsWith('file:')
      ) {
        return false
      }
    }

    // Check for excessive nesting (potential DoS or obfuscation)
    const nestingDepth = calculateMaxNestingDepth(content)
    if (nestingDepth > 100) {
      return false
    }

    return true
  } catch (_error) {
    // If any error occurs during validation, reject as unsafe
    return false
  }
}

/**
 * Calculate maximum nesting depth of XML/SVG elements
 * Helps detect overly complex or malicious structures
 */
function calculateMaxNestingDepth(content: string): number {
  let maxDepth = 0
  let currentDepth = 0

  // Simple depth calculation based on opening/closing tags
  const tagPattern = /<\/?[\w:-]+/g
  const matches = content.match(tagPattern) || []

  for (const match of matches) {
    if (match.startsWith('</')) {
      currentDepth--
    } else {
      currentDepth++
      maxDepth = Math.max(maxDepth, currentDepth)
    }
  }

  return maxDepth
}
