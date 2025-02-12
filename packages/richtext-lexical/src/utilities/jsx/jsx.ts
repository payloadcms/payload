/**
 * Converts an object of props to a JSX props string.
 *
 * This function is the inverse of `extractPropsFromJSXPropsString`.
 */
export function propsToJSXString({ props }: { props: Record<string, any> }): string {
  const propsArray: string[] = []

  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'string') {
      // Handle simple string props
      propsArray.push(`${key}="${escapeQuotes(value)}"`)
    } else if (typeof value === 'number') {
      // Handle number and boolean props
      propsArray.push(`${key}={${value}}`)
    } else if (typeof value === 'boolean') {
      if (value) {
        propsArray.push(`${key}`)
      }
    } else if (value !== null && typeof value === 'object') {
      if (Array.isArray(value)) {
        // Handle array props
        propsArray.push(`${key}={[${value.map((v) => JSON.stringify(v, replacer)).join(', ')}]}`)
      } else {
        // Handle complex object props
        propsArray.push(`${key}={${JSON.stringify(value, replacer)}}`)
      }
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

      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      result[key.trim()] = value
    }
  }

  return result
}

/**
 * Converts an object to a frontmatter string.
 */
export function objectToFrontmatter(obj: Record<string, any>): null | string {
  if (!Object.entries(obj)?.length) {
    return null
  }
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
  // eslint-disable-next-line regexp/no-super-linear-backtracking
  const frontmatterRegex = /^---\s*\n[\s\S]*?\n---\s*\n/
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
