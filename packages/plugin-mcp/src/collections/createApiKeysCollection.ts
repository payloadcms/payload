import type { CollectionConfig } from 'payload'

import type { PluginMCPServerConfig } from '../types.js'

import { toCamelCase } from '../utils/camelCase.js'
import { createApiKeyFields } from '../utils/createApiKeyFields.js'

// Define operations for collections
const COLLECTION_OPERATIONS = [
  {
    name: 'find',
    description: (slug: string) => `Allow clients to find ${slug}.`,
    label: 'Find',
  },
  {
    name: 'create',
    description: (slug: string) => `Allow clients to create ${slug}.`,
    label: 'Create',
  },
  {
    name: 'update',
    description: (slug: string) => `Allow clients to update ${slug}.`,
    label: 'Update',
  },
  {
    name: 'delete',
    description: (slug: string) => `Allow clients to delete ${slug}.`,
    label: 'Delete',
  },
]

// Define operations for globals
const GLOBAL_OPERATIONS = [
  {
    name: 'find',
    description: (slug: string) => `Allow clients to find ${slug} global.`,
    label: 'Find',
  },
  {
    name: 'update',
    description: (slug: string) => `Allow clients to update ${slug} global.`,
    label: 'Update',
  },
]

export const createAPIKeysCollection = (
  collections: PluginMCPServerConfig['collections'],
  globals: PluginMCPServerConfig['globals'],
  customTools: Array<{ description: string; name: string }> = [],
  experimentalTools: NonNullable<PluginMCPServerConfig['experimental']>['tools'] = {},
): CollectionConfig => {
  const customToolsFields = customTools.map((tool) => {
    const camelCasedName = toCamelCase(tool.name)
    return {
      name: camelCasedName,
      type: 'checkbox' as const,
      admin: {
        description: tool.description,
      },
      defaultValue: true,
      label: camelCasedName,
    }
  })

  return {
    slug: 'payload-mcp-api-keys',
    admin: {
      group: 'MCP',
      useAsTitle: 'label',
    },
    auth: {
      disableLocalStrategy: true,
      useAPIKey: true,
    },
    fields: [
      {
        name: 'user',
        type: 'relationship',
        admin: {
          description: 'The user that the API key is associated with.',
        },
        relationTo: 'users',
        required: true,
      },
      {
        name: 'label',
        type: 'text',
        admin: {
          description: 'A useful label for the API key.',
        },
      },
      {
        name: 'description',
        type: 'text',
        admin: {
          description: 'The purpose of the API key.',
        },
      },

      ...createApiKeyFields(collections, 'collection', COLLECTION_OPERATIONS),

      ...createApiKeyFields(globals, 'global', GLOBAL_OPERATIONS),

      ...(customTools.length > 0
        ? [
            {
              type: 'collapsible' as const,
              admin: {
                position: 'sidebar' as const,
              },
              fields: [
                {
                  name: 'custom',
                  type: 'group' as const,
                  fields: customToolsFields,
                },
              ],
              label: 'Custom Tools',
            },
          ]
        : []),

      // Experimental Tools
      ...(process.env.NODE_ENV === 'development' &&
      (experimentalTools?.collections?.enabled ||
        experimentalTools?.jobs?.enabled ||
        experimentalTools?.config?.enabled ||
        experimentalTools?.auth?.enabled)
        ? [
            {
              type: 'collapsible' as const,
              admin: {
                position: 'sidebar' as const,
              },
              fields: [
                ...(experimentalTools?.collections?.enabled
                  ? [
                      {
                        name: 'collections',
                        type: 'group' as const,
                        fields: [
                          {
                            name: 'find',
                            type: 'checkbox' as const,
                            admin: {
                              description:
                                'Allow LLMs to find and list Payload collections with optional content and document counts.',
                            },
                            defaultValue: false,
                          },
                          {
                            name: 'create',
                            type: 'checkbox' as const,
                            admin: {
                              description:
                                'Allow LLMs to create new Payload collections with specified fields and configuration.',
                            },
                            defaultValue: false,
                          },
                          {
                            name: 'update',
                            type: 'checkbox' as const,
                            admin: {
                              description:
                                'Allow LLMs to update existing Payload collections with new fields, modifications, or configuration changes.',
                            },
                            defaultValue: false,
                          },
                          {
                            name: 'delete',
                            type: 'checkbox' as const,
                            admin: {
                              description:
                                'Allow LLMs to delete Payload collections and optionally update the configuration.',
                            },
                            defaultValue: false,
                          },
                        ],
                      },
                    ]
                  : []),
                ...(experimentalTools?.jobs?.enabled
                  ? [
                      {
                        name: 'jobs',
                        type: 'group' as const,
                        fields: [
                          {
                            name: 'create',
                            type: 'checkbox' as const,
                            admin: {
                              description:
                                'Allow LLMs to create new Payload jobs (tasks and workflows) with custom schemas and configuration.',
                            },
                            defaultValue: false,
                          },
                          {
                            name: 'run',
                            type: 'checkbox' as const,
                            admin: {
                              description:
                                'Allow LLMs to execute Payload jobs with custom input data and queue options.',
                            },
                            defaultValue: false,
                          },
                          {
                            name: 'update',
                            type: 'checkbox' as const,
                            admin: {
                              description:
                                'Allow LLMs to update existing Payload jobs with new schemas, configuration, or handler code.',
                            },
                            defaultValue: false,
                          },
                        ],
                      },
                    ]
                  : []),
                ...(experimentalTools?.config?.enabled
                  ? [
                      {
                        name: 'config',
                        type: 'group' as const,
                        fields: [
                          {
                            name: 'find',
                            type: 'checkbox' as const,
                            admin: {
                              description:
                                'Allow LLMs to read and display a Payload configuration file.',
                            },
                            defaultValue: false,
                          },
                          {
                            name: 'update',
                            type: 'checkbox' as const,
                            admin: {
                              description:
                                'Allow LLMs to update a Payload configuration file with various modifications.',
                            },
                            defaultValue: false,
                          },
                        ],
                      },
                    ]
                  : []),
                ...(experimentalTools?.auth?.enabled
                  ? [
                      {
                        name: 'auth',
                        type: 'group' as const,
                        fields: [
                          {
                            name: 'auth',
                            type: 'checkbox' as const,
                            admin: {
                              description:
                                'Allow LLMs to check authentication status for a user by setting custom headers. (e.g. {"Authorization": "Bearer <token>"})',
                            },
                            defaultValue: false,
                            label: 'Check Auth Status',
                          },
                          {
                            name: 'login',
                            type: 'checkbox' as const,
                            admin: {
                              description:
                                'Allow LLMs to authenticate a user with email and password.',
                            },
                            defaultValue: false,
                            label: 'User Login',
                          },
                          {
                            name: 'verify',
                            type: 'checkbox' as const,
                            admin: {
                              description:
                                'Allow LLMs to verify a user email with a verification token.',
                            },
                            defaultValue: false,
                            label: 'Email Verification',
                          },
                          {
                            name: 'resetPassword',
                            type: 'checkbox' as const,
                            admin: {
                              description:
                                'Allow LLMs to reset a user password with a reset token.',
                            },
                            defaultValue: false,
                            label: 'Reset Password',
                          },
                          {
                            name: 'forgotPassword',
                            type: 'checkbox' as const,
                            admin: {
                              description: 'Allow LLMs to send a password reset email to a user.',
                            },
                            defaultValue: false,
                            label: 'Forgot Password',
                          },
                          {
                            name: 'unlock',
                            type: 'checkbox' as const,
                            admin: {
                              description:
                                'Allow LLMs to unlock a user account that has been locked due to failed login attempts.',
                            },
                            defaultValue: false,
                            label: 'Unlock Account',
                          },
                        ],
                      },
                    ]
                  : []),
              ],
              label: 'Experimental Tools',
            },
          ]
        : []),
    ],
    labels: {
      plural: 'API Keys',
      singular: 'API Key',
    },
  }
}
