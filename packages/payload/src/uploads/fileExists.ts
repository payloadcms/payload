import fs from 'fs/promises'

export const fileExists = async (filename: string): Promise<boolean> => {
  try {
    await fs.stat(filename)

    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false
    }

    throw error
  }
}
