// Example input: type="info" hello={{heyyy: 'test', someNumber: 2}}
export function extractPropsFromJSXPropsString({
  propsString,
}: {
  propsString: string
}): Record<string, any> {
  const props = {}

  // Parse simple key-value pairs
  const simplePropsRegex = /(\w+)="([^"]*)"/g
  let match
  while ((match = simplePropsRegex.exec(propsString)) !== null) {
    const [, key, value] = match
    props[key] = value
  }

  // Parse complex JSON-like props
  const complexPropsRegex = /(\w+)=\{\{(.*?)\}\}/g
  while ((match = complexPropsRegex.exec(propsString)) !== null) {
    const [, key, value] = match
    try {
      props[key] = JSON.parse(`{${value}}`)
    } catch (error) {
      console.error(`Error parsing complex prop ${key}:`, error)
    }
  }

  return props
}

export function propsToJSXString({ props }: { props: Record<string, any> }): string {
  const propsArray: string[] = []

  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'string') {
      // Handle simple string props
      propsArray.push(`${key}="${escapeQuotes(value)}"`)
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      // Handle number and boolean props
      propsArray.push(`${key}={${value}}`)
    } else if (value !== null && typeof value === 'object') {
      // Handle complex object props
      propsArray.push(`${key}={{${JSON.stringify(value, replacer)}}}`)
    }
  }

  return propsArray.join(' ')
}

// Helper function to escape quotes in string values
function escapeQuotes(str: string): string {
  return str.replace(/"/g, '&quot;')
}

// Custom replacer function for JSON.stringify to handle single quotes
function replacer(key: string, value: any): any {
  if (typeof value === 'string') {
    return value.replace(/'/g, "\\'")
  }
  return value
}

/**
 * Converts a frontmatter string to an object.
 */
export function frontmatterToObject(frontmatter: string): Record<string, any> {
  const lines = frontmatter.trim().split('\n')
  const result = {}
  let inFrontmatter = false

  for (const line of lines) {
    if (line.trim() === '---') {
      inFrontmatter = !inFrontmatter
      continue
    }

    if (inFrontmatter) {
      const [key, ...valueParts] = line.split(':')
      const value = valueParts.join(':').trim()

      result[key.trim()] = value
    }
  }

  return result
}

/**
 * Converts an object to a frontmatter string.
 */
export function objectToFrontmatter(obj: Record<string, any>): string {
  let frontmatter = '---\n'

  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      frontmatter += `${key}: ${value.join(', ')}\n`
    } else {
      frontmatter += `${key}: ${value}\n`
    }
  }

  frontmatter += '---\n'
  return frontmatter
}

/**
 * Takes an MDX content string and extracts the frontmatter and content.
 *
 * The resulting object contains the mdx content without the frontmatter and the frontmatter itself.
 */
export function extractFrontmatter(mdxContent: string) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/
  const match = mdxContent.match(frontmatterRegex)

  if (match) {
    const frontmatter = match[0]
    const contentWithoutFrontmatter = mdxContent.slice(frontmatter.length).trim()
    return {
      content: contentWithoutFrontmatter,
      frontmatter: frontmatter.trim(),
    }
  } else {
    // If no frontmatter is found, return the original content
    return {
      content: mdxContent.trim(),
      frontmatter: '',
    }
  }
}
