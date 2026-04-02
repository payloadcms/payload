import fs from 'fs/promises'

export const fileExists = async (filename: string): Promise<boolean> => {
  try {
    await fs.stat(filename)

    return true
  } catch (ignore) {
    return false
  }
}
