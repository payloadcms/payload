import type { GlobalConfig, TextFieldManyValidation } from 'payload'

import { revalidateWebsiteGlobal } from '../../hooks/revalidateWebsite'
import { personalWebsiteGroup, seoField } from '../fields'

const validateRepositories: TextFieldManyValidation = (value) => {
  const invalid = (value ?? []).filter((repository) => !/^[\w.-]+\/[\w.-]+$/.test(repository))

  return (
    invalid.length === 0 ||
    `Use owner/name, e.g. atorpos/visa-status-api (not: ${invalid.join(', ')})`
  )
}

/**
 * The texts of the personal website's Projects page (/projects): open-source projects from GitHub,
 * then the projects under Projects. Until it's saved, the website shows content/projects.md.
 */
export const PersonalProjectsPage: GlobalConfig = {
  slug: 'personal-projects-page',
  access: {
    read: () => true,
  },
  admin: {
    description: 'The projects themselves are under Projects.',
    group: personalWebsiteGroup,
  },
  fields: [
    {
      name: 'github',
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text',
          admin: {
            description: 'e.g. My Open-Source Projects',
          },
        },
        {
          name: 'text',
          type: 'textarea',
        },
        {
          name: 'repositories',
          type: 'text',
          admin: {
            description:
              'GitHub repositories as owner/name, e.g. atorpos/visa-status-api. The website shows their description, language and stars (it needs GITHUB_TOKEN for that).',
          },
          hasMany: true,
          validate: validateRepositories,
        },
      ],
      label: 'Open-source projects',
    },
    {
      name: 'projects',
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text',
          admin: {
            description: 'e.g. Latest Projects',
          },
        },
        {
          name: 'text',
          type: 'textarea',
        },
      ],
      label: 'Projects',
    },
    seoField,
  ],
  hooks: {
    afterChange: [revalidateWebsiteGlobal],
  },
  label: 'Projects page',
}
