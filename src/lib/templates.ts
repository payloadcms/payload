import { error, info } from '../utils/log'
import type { GitTemplate, ProjectTemplate } from '../types'

export async function validateTemplate(templateName: string): Promise<boolean> {
  const validTemplates = await getValidTemplates()
  if (!validTemplates.map(t => t.name).includes(templateName)) {
    error(`'${templateName}' is not a valid template.`)
    info(`Valid templates: ${validTemplates.map(t => t.name).join(', ')}`)
    return false
  }
  return true
}

export async function getValidTemplates(): Promise<ProjectTemplate[]> {
  const templates: ProjectTemplate[] = [
    {
      name: 'blank',
      type: 'static',
      description: 'Blank',
      directory: 'blank',
    },
    {
      name: 'todo',
      type: 'static',
      description: 'Todo list',
      directory: 'todo',
    },
    {
      name: 'blog',
      type: 'static',
      description: 'Blog',
      directory: 'blog',
    },
  ]

  const starters: GitTemplate[] = [
    {
      name: 'payload-demo',
      type: 'starter',
      url: 'https://github.com/payloadcms/public-demo',
      description: 'Payload demo site at https://demo.payloadcms.com',
    },
    {
      name: 'payload-website',
      type: 'starter',
      url: 'https://github.com/payloadcms/website-cms',
      description: 'Payload website CMS at https://payloadcms.com',
    },
    {
      name: 'cloud-template-blank',
      type: 'starter',
      url: 'https://github.com/payloadcms/template-blank',
      description: 'Blank template for Payload Cloud',
    },
    {
      name: 'cloud-template-website',
      type: 'starter',
      url: 'https://github.com/payloadcms/template-website',
      description: 'Website template for Payload Cloud',
    },
    {
      name: 'cloud-template-ecommerce',
      type: 'starter',
      url: 'https://github.com/payloadcms/template-ecommerce',
      description: 'E-commerce template for Payload Cloud',
    },
  ]

  return [...templates, ...starters]
}
