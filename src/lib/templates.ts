import path from 'path'
import fs from 'fs'
import { error, info } from '../utils/log'
import type { ProjectTemplate } from '../types'

export async function validateTemplate(templateName: string): Promise<boolean> {
  const validTemplates = await getValidTemplates()
  if (!validTemplates.map(t => t.name).includes(templateName)) {
    error(`'${templateName}' is not a valid template.`)
    info(`Valid templates: ${validTemplates.join(', ')}`)
    return false
  }
  return true
}

export async function getValidTemplates(): Promise<ProjectTemplate[]> {
  const templateDir = path.resolve(__dirname, '../templates')
  const dirs = getDirectories(templateDir)

  const templates: ProjectTemplate[] = dirs.map(name => {
    return { name, type: 'static' }
  })
  return templates
}

function getDirectories(dir: string) {
  return fs.readdirSync(dir).filter(file => {
    return fs.statSync(dir + '/' + file).isDirectory()
  })
}
