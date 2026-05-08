import * as fs from 'fs'
import * as path from 'path'

export function readSystemPrompt(promptFilePath: string): string {
  const absolutePath = path.resolve(process.env.GITHUB_WORKSPACE ?? process.cwd(), promptFilePath)
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Reviewer prompt file not found: ${promptFilePath}`)
  }
  return fs.readFileSync(absolutePath, 'utf-8')
}
