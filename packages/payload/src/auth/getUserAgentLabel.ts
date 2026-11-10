// Checked in order: each browser's User-Agent also names the ones it's based on
const browsers: [name: string, pattern: RegExp][] = [
  ['Edge', /Edg(?:e|A|iOS)?\//],
  ['Opera', /OPR\/|Opera/],
  ['Samsung Internet', /SamsungBrowser\//],
  ['Firefox', /Firefox\/|FxiOS\//],
  ['Chrome', /Chrome\/|CriOS\//],
  ['Safari', /Safari\//],
]

// Android before Linux, since Android's User-Agent mentions Linux too
const operatingSystems: [name: string, pattern: RegExp][] = [
  ['iOS', /iPhone|iPad|iPod/],
  ['Android', /Android/],
  ['ChromeOS', /CrOS/],
  ['macOS', /Macintosh|Mac OS X/],
  ['Windows', /Windows/],
  ['Linux', /Linux/],
]

/**
 * A label for a session from the browser that started it, e.g. "Chrome on macOS". `undefined`
 * when the User-Agent doesn't name a known browser or operating system, e.g. for scripts.
 */
export const getUserAgentLabel = ({
  userAgent,
}: {
  userAgent: null | string | undefined
}): string | undefined => {
  if (!userAgent) {
    return undefined
  }

  const browser = browsers.find(([, pattern]) => pattern.test(userAgent))?.[0]
  const operatingSystem = operatingSystems.find(([, pattern]) => pattern.test(userAgent))?.[0]

  if (browser && operatingSystem) {
    return `${browser} on ${operatingSystem}`
  }

  return browser ?? operatingSystem
}
