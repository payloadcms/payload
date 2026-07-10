import type { AllowList } from 'payload'

export const isURLAllowed = (url: string, allowList: AllowList): boolean => {
  try {
    const parsedUrl = new URL(url)

    return allowList.some((allowItem) => {
      return Object.entries(allowItem).every(([key, value]) => {
        // Skip undefined or null values
        if (!value) {
          return true
        }
        // Compare protocol with colon
        if (key === 'protocol') {
          return typeof value === 'string' && parsedUrl.protocol === `${value}:`
        }

        if (key === 'pathname') {
          // Translate a small glob syntax to a regex. The pattern is escaped
          // first so that metacharacters in the configured value (e.g. `.`)
          // match literally and cannot broaden what the allow-list accepts.
          // Wildcards become `\*` once escaped, so they are restored afterwards
          // — translating `**` before `*` is safe because the resulting `.*`
          // no longer contains an escaped `\*` for the next replace to match.
          const regexPattern = value
            .replace(/[\\^$*+?.()|[\]{}]/g, '\\$&') // Escape regex metacharacters
            .replace(/\\\*\\\*/g, '.*') // `**` → match any path
            .replace(/\\\*/g, '[^/]*') // `*` → match any part of a path segment
          const regex = new RegExp(`^${regexPattern}$`)
          return regex.test(parsedUrl.pathname)
        }

        // Default comparison for all other properties (hostname, port, search)
        return parsedUrl[key as keyof URL] === value
      })
    })
  } catch {
    return false // If the URL is invalid, deny by default
  }
}
