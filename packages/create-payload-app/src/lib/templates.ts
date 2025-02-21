import type { ProjectTemplate } from '../types.js'

import { error, info } from '../utils/log.js'
import { PACKAGE_VERSION } from './constants.js'

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
  // Starters _must_ be a valid template name from the templates/ directory
  return [
    {
      name: 'blank',
      type: 'starter',
      description: 'Blank 3.0 Template',
      url: `https://github.com/payloadcms/payload/templates/blank#v${PACKAGE_VERSION}`,
    },
    {
      name: 'website',
      type: 'starter',
      description: 'Website Template',
      url: `https://github.com/payloadcms/payload/templates/website#v${PACKAGE_VERSION}`,
    },
    {
      name: 'plugin',
      type: 'plugin',
      description: 'Template for creating a Payload plugin',
      url: 'https://github.com/payloadcms/payload/templates/plugin#main',
    },
  ]
}
