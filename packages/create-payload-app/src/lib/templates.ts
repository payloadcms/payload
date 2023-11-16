import type { ProjectTemplate } from '../types'

import { error, info } from '../utils/log'

export function validateTemplate(templateName: string): boolean {
  const validTemplates = getValidTemplates()
  if (!validTemplates.map((t) => t.name).includes(templateName)) {
    error(`'${templateName}' is not a valid template.`)
    info(`Valid templates: ${validTemplates.map((t) => t.name).join(', ')}`)
    return false
  }
  return true
}

export function getValidTemplates(): ProjectTemplate[] {
  return [
    {
      name: 'blank',
      description: 'Blank Template',
      type: 'starter',
      url: 'https://github.com/payloadcms/payload/templates/blank',
    },
    {
      name: 'website',
      description: 'Website Template',
      type: 'starter',
      url: 'https://github.com/payloadcms/payload/templates/website',
    },
    {
      name: 'ecommerce',
      description: 'E-commerce Template',
      type: 'starter',
      url: 'https://github.com/payloadcms/payload/templates/ecommerce',
    },
    {
      name: 'plugin',
      description: 'Template for creating a Payload plugin',
      type: 'plugin',
      url: 'https://github.com/payloadcms/payload-plugin-template',
    },
    {
      name: 'payload-demo',
      description: 'Payload demo site at https://demo.payloadcms.com',
      type: 'starter',
      url: 'https://github.com/payloadcms/public-demo',
    },
    {
      name: 'payload-website',
      description: 'Payload website CMS at https://payloadcms.com',
      type: 'starter',
      url: 'https://github.com/payloadcms/website-cms',
    },
  ]
}
