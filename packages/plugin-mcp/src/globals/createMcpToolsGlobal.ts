import type { GlobalConfig } from 'payload'

import { toCamelCase } from '../utils/camelCase.js'

export const createMcpToolsGlobal = (
  customTools: Array<{ description: string; name: string }> = [],
): GlobalConfig => {
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
    slug: 'payload-mcp-tools',
    admin: {
      group: 'MCP',
    },
    fields: [
      // General Tools
      {
        type: 'collapsible',
        fields: [
          {
            name: 'resources',
            type: 'group',
            fields: [
              {
                name: 'find',
                type: 'checkbox',
                admin: {
                  description: 'Find documents in a Collection.',
                },
                defaultValue: true,
              },
              {
                name: 'create',
                type: 'checkbox',
                admin: {
                  description: 'Create documents in a Collection.',
                },
                defaultValue: false,
              },
              {
                name: 'update',
                type: 'checkbox',
                admin: {
                  description: 'Update documents in a Collection.',
                },
                defaultValue: false,
              },
              {
                name: 'delete',
                type: 'checkbox',
                admin: {
                  description: 'Delete documents from a Collection.',
                },
                defaultValue: false,
              },
            ],
          },
          ...(customTools.length > 0
            ? [
                {
                  name: 'custom',
                  type: 'group' as const,
                  fields: customToolsFields,
                },
              ]
            : []),
        ],
        label: 'General',
      },
      // Development Tools (Experimental)
      {
        type: 'collapsible',
        fields: [
          {
            name: 'collections',
            type: 'group',
            fields: [
              {
                name: 'find',
                type: 'checkbox',
                admin: {
                  description:
                    'Find and list Payload collections with optional content and document counts.',
                },
                defaultValue: false,
              },
              {
                name: 'create',
                type: 'checkbox',
                admin: {
                  description:
                    'Create new Payload collections with specified fields and configuration.',
                },
                defaultValue: false,
              },
              {
                name: 'update',
                type: 'checkbox',
                admin: {
                  description:
                    'Update existing Payload collections with new fields, modifications, or configuration changes.',
                },
                defaultValue: false,
              },
              {
                name: 'delete',
                type: 'checkbox',
                admin: {
                  description:
                    'Delete Payload collections and optionally update the configuration.',
                },
                defaultValue: false,
              },
            ],
          },
          {
            name: 'jobs',
            type: 'group',
            fields: [
              {
                name: 'create',
                type: 'checkbox',
                admin: {
                  description:
                    'Create new Payload jobs (tasks and workflows) with custom schemas and configuration.',
                },
                defaultValue: false,
              },
              {
                name: 'run',
                type: 'checkbox',
                admin: {
                  description: 'Execute Payload jobs with custom input data and queue options.',
                },
                defaultValue: false,
              },
              {
                name: 'update',
                type: 'checkbox',
                admin: {
                  description:
                    'Update existing Payload jobs with new schemas, configuration, or handler code.',
                },
                defaultValue: false,
              },
            ],
          },
          {
            name: 'config',
            type: 'group',
            fields: [
              {
                name: 'find',
                type: 'checkbox',
                admin: {
                  description: 'Read and display a Payload configuration file.',
                },
                defaultValue: false,
              },
              {
                name: 'update',
                type: 'checkbox',
                admin: {
                  description: 'Update a Payload configuration file with various modifications.',
                },
                defaultValue: false,
              },
            ],
          },
        ],
        label: 'Development',
      },
      // Administration Tools (Experimental)
      {
        type: 'collapsible',
        fields: [
          {
            name: 'auth',
            type: 'group',
            fields: [
              {
                name: 'auth',
                type: 'checkbox',
                admin: {
                  description:
                    'Check authentication status for a user by setting custom headers. (e.g. {"Authorization": "Bearer <token>"})',
                },
                defaultValue: false,
                label: 'Check Auth Status',
              },
              {
                name: 'login',
                type: 'checkbox',
                admin: {
                  description: 'Authenticate a user with email and password.',
                },
                defaultValue: false,
                label: 'User Login',
              },
              {
                name: 'verify',
                type: 'checkbox',
                admin: {
                  description: 'Verify a user email with a verification token.',
                },
                defaultValue: false,
                label: 'Email Verification',
              },
              {
                name: 'resetPassword',
                type: 'checkbox',
                admin: {
                  description: 'Reset a user password with a reset token.',
                },
                defaultValue: false,
                label: 'Reset Password',
              },
              {
                name: 'forgotPassword',
                type: 'checkbox',
                admin: {
                  description: 'Send a password reset email to a user.',
                },
                defaultValue: false,
                label: 'Forgot Password',
              },
              {
                name: 'unlock',
                type: 'checkbox',
                admin: {
                  description:
                    'Unlock a user account that has been locked due to failed login attempts.',
                },
                defaultValue: false,
                label: 'Unlock Account',
              },
            ],
          },
        ],
        label: 'Administration',
      },
    ],
    label: 'Tools',
  }
}
