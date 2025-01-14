import type { AllowList } from 'payload'

export const isUrlAllowed = (url: string, allowList: AllowList): boolean => {
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
          return parsedUrl.protocol === `${value}:`
        }
        return parsedUrl[key as keyof URL] === value
      })
    })
  } catch {
    return false // If the URL is invalid, deny by default
  }
}
