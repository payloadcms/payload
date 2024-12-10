import fs from 'fs'

export function ensureDirectoryExists(directory) {
  try {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true })
    }
  } catch (error) {
    console.error(`Error creating directory '${directory}': ${error.message}`)
  }
}
