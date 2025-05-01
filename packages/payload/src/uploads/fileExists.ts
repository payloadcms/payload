import fs from 'fs/promises'

const fileExists = async (filename: string): Promise<boolean> => {
  try {
    await fs.stat(filename)

    return true
  } catch (err) {
    return false
  }
}

export default fileExists
