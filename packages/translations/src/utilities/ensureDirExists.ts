import fs from 'fs'

export function ensureDirectoryExists(directory: string) {
  try {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true })
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    // eslint-disable-next-line no-console
    console.error(`Error creating directory '${directory}': ${msg}`)
  }
}
