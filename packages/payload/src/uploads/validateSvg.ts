/**
 * Validate SVG content for security vulnerabilities
 * Detects and blocks malicious patterns commonly used in SVG-based attacks
 */
export function validateSvg(buffer: Buffer): boolean {
  try {
    const content = buffer.toString('utf8')

    const dangerousPatterns = [
      // Script tags
      /<(?:[^<>\s/:]+:)?script[\s>]/i,
      /<\/(?:[^<>\s/:]+:)?script\s*>/i,

      // Event handlers (onclick, onload, onerror, etc.)
      /\son\w+\s*=/i,

      // JavaScript URLs
      /javascript:/i,
      /data:text\/html/i,

      // Foreign objects (can embed HTML)
      /<(?:[^<>\s/:]+:)?foreignObject[\s>]/i,

      // Embedded iframes
      /<(?:[^<>\s/:]+:)?iframe[\s>]/i,

      // Embedded objects and embeds
      /<(?:[^<>\s/:]+:)?object[\s>]/i,
      /<(?:[^<>\s/:]+:)?embed[\s>]/i,

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

    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        return false
      }
    }

    return true
  } catch (_error) {
    return false
  }
}
