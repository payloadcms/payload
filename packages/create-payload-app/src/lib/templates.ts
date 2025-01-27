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
      type: 'starter',
      description: 'Blank Template',
      url: 'https://github.com/payloadcms/payload/templates/blank#v2.30.3',
    },
    {
      name: 'website',
      type: 'starter',
      description: 'Website Template',
      url: 'https://github.com/payloadcms/payload/templates/website#v2.30.3',
    },
    {
      name: 'ecommerce',
      type: 'starter',
      description: 'E-commerce Template',
      url: 'https://github.com/payloadcms/payload/templates/ecommerce#v2.30.3',
    },
    {
      name: 'plugin',
      type: 'plugin',
      description: 'Template for creating a Payload plugin',
      url: 'https://github.com/payloadcms/payload-plugin-template',
    },
    {
      name: 'payload-demo',
      type: 'starter',
      description: 'Payload demo site at https://demo.payloadcms.com',
      url: 'https://github.com/payloadcms/public-demo',
    },
    {
      name: 'payload-website',
      type: 'starter',
      description: 'Payload website CMS at https://payloadcms.com',
      url: 'https://github.com/payloadcms/website-cms',
    },
  ]
}
