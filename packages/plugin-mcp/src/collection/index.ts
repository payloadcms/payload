import type { CollectionConfig, Config, Field, SanitizedConfig } from 'payload'

import type { MCPPluginConfig } from '../types.js'

import { toCamelCase } from '../utils/camelCase.js'
import { getAccessFields } from './getAccessFields.js'

export const getAPIKeysCollection = ({
  config,
  pluginConfig,
}: {
  config: Config | SanitizedConfig
  pluginConfig: MCPPluginConfig
}): CollectionConfig => {
  const collection: CollectionConfig = {
    slug: 'payload-mcp-api-keys',
    admin: {
      description:
        'API keys control which collections, resources, tools, and prompts MCP clients can access',
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
        relationTo: pluginConfig.userCollection!,
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

      ...getAccessFields({
        config,
        entityType: 'collection',
        pluginConfig,
      }),

      ...getAccessFields({
        config,
        entityType: 'global',
        pluginConfig,
      }),

      ...(pluginConfig.mcp?.tools?.length
        ? ([
            {
              type: 'collapsible',
              admin: {
                description: 'Manage client access to tools',
                position: 'sidebar',
              },
              fields: [
                {
                  name: 'payload-mcp-tool',
                  type: 'group',
                  fields: pluginConfig.mcp.tools.map((tool) => {
                    const camelCasedName = toCamelCase(tool.name)
                    return {
                      name: camelCasedName,
                      type: 'checkbox',
                      admin: {
                        description: tool.description,
                      },
                      defaultValue: true,
                      label: camelCasedName,
                    }
                  }),
                  label: false,
                },
              ],
              label: 'Tools',
            },
          ] satisfies Field[])
        : []),

      ...(pluginConfig.mcp?.resources?.length
        ? ([
            {
              type: 'collapsible',
              admin: {
                description: 'Manage client access to resources',
                position: 'sidebar',
              },
              fields: [
                {
                  name: 'payload-mcp-resource',
                  type: 'group',
                  fields: pluginConfig.mcp.resources.map((resource) => {
                    const camelCasedName = toCamelCase(resource.name)
                    return {
                      name: camelCasedName,
                      type: 'checkbox',
                      admin: {
                        description: resource.description,
                      },
                      defaultValue: true,
                      label: camelCasedName,
                    }
                  }),
                  label: false,
                },
              ],
              label: 'Resources',
            },
          ] satisfies Field[])
        : []),

      ...(pluginConfig.mcp?.prompts?.length
        ? ([
            {
              type: 'collapsible',
              admin: {
                description: 'Manage client access to prompts',
                position: 'sidebar',
              },
              fields: [
                {
                  name: 'payload-mcp-prompt',
                  type: 'group',
                  fields: pluginConfig.mcp.prompts.map((prompt) => {
                    const camelCasedName = toCamelCase(prompt.name)
                    return {
                      name: camelCasedName,
                      type: 'checkbox',
                      admin: {
                        description: prompt.description,
                      },
                      defaultValue: true,
                      label: camelCasedName,
                    }
                  }),
                  label: false,
                },
              ],
              label: 'Prompts',
            },
          ] satisfies Field[])
        : []),

      // Experimental Tools
      ...(process.env.NODE_ENV === 'development' && pluginConfig?.experimental?.tools?.auth?.enabled
        ? ([
            {
              type: 'collapsible',
              admin: {
                description: 'Manage client access to experimental tools',
                position: 'sidebar',
              },
              fields: [
                ...(pluginConfig?.experimental?.tools?.auth?.enabled
                  ? ([
                      {
                        name: 'auth',
                        type: 'group',
                        fields: [
                          {
                            name: 'auth',
                            type: 'checkbox',
                            admin: {
                              description:
                                'Allow LLMs to check authentication status for a user by setting custom headers. (e.g. {"Authorization": "Bearer <token>"})',
                            },
                            defaultValue: false,
                            label: 'Check Auth Status',
                          },
                          {
                            name: 'login',
                            type: 'checkbox',
                            admin: {
                              description:
                                'Allow LLMs to authenticate a user with email and password.',
                            },
                            defaultValue: false,
                            label: 'User Login',
                          },
                          {
                            name: 'verify',
                            type: 'checkbox',
                            admin: {
                              description:
                                'Allow LLMs to verify a user email with a verification token.',
                            },
                            defaultValue: false,
                            label: 'Email Verification',
                          },
                          {
                            name: 'resetPassword',
                            type: 'checkbox',
                            admin: {
                              description:
                                'Allow LLMs to reset a user password with a reset token.',
                            },
                            defaultValue: false,
                            label: 'Reset Password',
                          },
                          {
                            name: 'forgotPassword',
                            type: 'checkbox',
                            admin: {
                              description: 'Allow LLMs to send a password reset email to a user.',
                            },
                            defaultValue: false,
                            label: 'Forgot Password',
                          },
                          {
                            name: 'unlock',
                            type: 'checkbox',
                            admin: {
                              description:
                                'Allow LLMs to unlock a user account that has been locked due to failed login attempts.',
                            },
                            defaultValue: false,
                            label: 'Unlock Account',
                          },
                        ],
                      },
                    ] satisfies Field[])
                  : []),
              ],
              label: 'Experimental Tools',
            },
          ] satisfies Field[])
        : []),
    ],
    labels: {
      plural: 'API Keys',
      singular: 'API Key',
    },
  }

  return pluginConfig.overrideApiKeyCollection
    ? pluginConfig.overrideApiKeyCollection(collection)
    : collection
}
