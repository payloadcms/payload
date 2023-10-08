import type { ProjectTemplate } from '../types'
import { error, info } from '../utils/log'

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
  return [
    {
      name: 'blank',
      type: 'starter',
      url: 'https://github.com/payloadcms/payload/templates/blank',
      description: 'Blank Template',
    },
    {
      name: 'website',
      type: 'starter',
      url: 'https://github.com/payloadcms/payload/templates/website',
      description: 'Website Template',
    },
    {
      name: 'ecommerce',
      type: 'starter',
      url: 'https://github.com/payloadcms/payload/templates/ecommerce',
      description: 'E-commerce Template',
    },
    {
      name: 'plugin',
      type: 'plugin',
      url: 'https://github.com/payloadcms/payload-plugin-template',
      description: 'Template for creating a Payload plugin',
    },
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
  ]
}
