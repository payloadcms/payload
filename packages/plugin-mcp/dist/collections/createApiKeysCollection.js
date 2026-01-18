import { toCamelCase } from '../utils/camelCase.js';
import { createApiKeyFields } from '../utils/createApiKeyFields.js';
export const createAPIKeysCollection = (collections, globals, customTools = [], experimentalTools = {}, pluginOptions)=>{
    const customToolsFields = customTools.map((tool)=>{
        const camelCasedName = toCamelCase(tool.name);
        return {
            name: camelCasedName,
            type: 'checkbox',
            admin: {
                description: tool.description
            },
            defaultValue: true,
            label: camelCasedName
        };
    });
    const customResourceFields = pluginOptions.mcp?.resources?.map((resource)=>{
        const camelCasedName = toCamelCase(resource.name);
        return {
            name: camelCasedName,
            type: 'checkbox',
            admin: {
                description: resource.description
            },
            defaultValue: true,
            label: camelCasedName
        };
    }) || [];
    const customPromptFields = pluginOptions.mcp?.prompts?.map((prompt)=>{
        const camelCasedName = toCamelCase(prompt.name);
        return {
            name: camelCasedName,
            type: 'checkbox',
            admin: {
                description: prompt.description
            },
            defaultValue: true,
            label: camelCasedName
        };
    }) || [];
    const userCollection = pluginOptions.userCollection;
    return {
        slug: 'payload-mcp-api-keys',
        admin: {
            description: 'API keys control which collections, resources, tools, and prompts MCP clients can access',
            group: 'MCP',
            useAsTitle: 'label'
        },
        auth: {
            disableLocalStrategy: true,
            useAPIKey: true
        },
        fields: [
            {
                name: 'user',
                type: 'relationship',
                admin: {
                    description: 'The user that the API key is associated with.'
                },
                relationTo: userCollection,
                required: true
            },
            {
                name: 'label',
                type: 'text',
                admin: {
                    description: 'A useful label for the API key.'
                }
            },
            {
                name: 'description',
                type: 'text',
                admin: {
                    description: 'The purpose of the API key.'
                }
            },
            ...createApiKeyFields({
                config: collections,
                configType: 'collection'
            }),
            ...createApiKeyFields({
                config: globals,
                configType: 'global'
            }),
            ...customTools.length > 0 ? [
                {
                    type: 'collapsible',
                    admin: {
                        description: 'Manage client access to tools',
                        position: 'sidebar'
                    },
                    fields: [
                        {
                            name: 'payload-mcp-tool',
                            type: 'group',
                            fields: customToolsFields,
                            label: false
                        }
                    ],
                    label: 'Tools'
                }
            ] : [],
            ...pluginOptions.mcp?.resources && pluginOptions.mcp?.resources.length > 0 ? [
                {
                    type: 'collapsible',
                    admin: {
                        description: 'Manage client access to resources',
                        position: 'sidebar'
                    },
                    fields: [
                        {
                            name: 'payload-mcp-resource',
                            type: 'group',
                            fields: customResourceFields,
                            label: false
                        }
                    ],
                    label: 'Resources'
                }
            ] : [],
            ...pluginOptions.mcp?.prompts && pluginOptions.mcp?.prompts.length > 0 ? [
                {
                    type: 'collapsible',
                    admin: {
                        description: 'Manage client access to prompts',
                        position: 'sidebar'
                    },
                    fields: [
                        {
                            name: 'payload-mcp-prompt',
                            type: 'group',
                            fields: customPromptFields,
                            label: false
                        }
                    ],
                    label: 'Prompts'
                }
            ] : [],
            // Experimental Tools
            ...process.env.NODE_ENV === 'development' && (experimentalTools?.collections?.enabled || experimentalTools?.jobs?.enabled || experimentalTools?.config?.enabled || experimentalTools?.auth?.enabled) ? [
                {
                    type: 'collapsible',
                    admin: {
                        description: 'Manage client access to experimental tools',
                        position: 'sidebar'
                    },
                    fields: [
                        ...experimentalTools?.collections?.enabled ? [
                            {
                                name: 'collections',
                                type: 'group',
                                fields: [
                                    {
                                        name: 'find',
                                        type: 'checkbox',
                                        admin: {
                                            description: 'Allow LLMs to find and list Payload collections with optional content and document counts.'
                                        },
                                        defaultValue: false
                                    },
                                    {
                                        name: 'create',
                                        type: 'checkbox',
                                        admin: {
                                            description: 'Allow LLMs to create new Payload collections with specified fields and configuration.'
                                        },
                                        defaultValue: false
                                    },
                                    {
                                        name: 'update',
                                        type: 'checkbox',
                                        admin: {
                                            description: 'Allow LLMs to update existing Payload collections with new fields, modifications, or configuration changes.'
                                        },
                                        defaultValue: false
                                    },
                                    {
                                        name: 'delete',
                                        type: 'checkbox',
                                        admin: {
                                            description: 'Allow LLMs to delete Payload collections and optionally update the configuration.'
                                        },
                                        defaultValue: false
                                    }
                                ]
                            }
                        ] : [],
                        ...experimentalTools?.jobs?.enabled ? [
                            {
                                name: 'jobs',
                                type: 'group',
                                fields: [
                                    {
                                        name: 'create',
                                        type: 'checkbox',
                                        admin: {
                                            description: 'Allow LLMs to create new Payload jobs (tasks and workflows) with custom schemas and configuration.'
                                        },
                                        defaultValue: false
                                    },
                                    {
                                        name: 'run',
                                        type: 'checkbox',
                                        admin: {
                                            description: 'Allow LLMs to execute Payload jobs with custom input data and queue options.'
                                        },
                                        defaultValue: false
                                    },
                                    {
                                        name: 'update',
                                        type: 'checkbox',
                                        admin: {
                                            description: 'Allow LLMs to update existing Payload jobs with new schemas, configuration, or handler code.'
                                        },
                                        defaultValue: false
                                    }
                                ]
                            }
                        ] : [],
                        ...experimentalTools?.config?.enabled ? [
                            {
                                name: 'config',
                                type: 'group',
                                fields: [
                                    {
                                        name: 'find',
                                        type: 'checkbox',
                                        admin: {
                                            description: 'Allow LLMs to read and display a Payload configuration file.'
                                        },
                                        defaultValue: false
                                    },
                                    {
                                        name: 'update',
                                        type: 'checkbox',
                                        admin: {
                                            description: 'Allow LLMs to update a Payload configuration file with various modifications.'
                                        },
                                        defaultValue: false
                                    }
                                ]
                            }
                        ] : [],
                        ...experimentalTools?.auth?.enabled ? [
                            {
                                name: 'auth',
                                type: 'group',
                                fields: [
                                    {
                                        name: 'auth',
                                        type: 'checkbox',
                                        admin: {
                                            description: 'Allow LLMs to check authentication status for a user by setting custom headers. (e.g. {"Authorization": "Bearer <token>"})'
                                        },
                                        defaultValue: false,
                                        label: 'Check Auth Status'
                                    },
                                    {
                                        name: 'login',
                                        type: 'checkbox',
                                        admin: {
                                            description: 'Allow LLMs to authenticate a user with email and password.'
                                        },
                                        defaultValue: false,
                                        label: 'User Login'
                                    },
                                    {
                                        name: 'verify',
                                        type: 'checkbox',
                                        admin: {
                                            description: 'Allow LLMs to verify a user email with a verification token.'
                                        },
                                        defaultValue: false,
                                        label: 'Email Verification'
                                    },
                                    {
                                        name: 'resetPassword',
                                        type: 'checkbox',
                                        admin: {
                                            description: 'Allow LLMs to reset a user password with a reset token.'
                                        },
                                        defaultValue: false,
                                        label: 'Reset Password'
                                    },
                                    {
                                        name: 'forgotPassword',
                                        type: 'checkbox',
                                        admin: {
                                            description: 'Allow LLMs to send a password reset email to a user.'
                                        },
                                        defaultValue: false,
                                        label: 'Forgot Password'
                                    },
                                    {
                                        name: 'unlock',
                                        type: 'checkbox',
                                        admin: {
                                            description: 'Allow LLMs to unlock a user account that has been locked due to failed login attempts.'
                                        },
                                        defaultValue: false,
                                        label: 'Unlock Account'
                                    }
                                ]
                            }
                        ] : []
                    ],
                    label: 'Experimental Tools'
                }
            ] : []
        ],
        labels: {
            plural: 'API Keys',
            singular: 'API Key'
        }
    };
};

//# sourceMappingURL=createApiKeysCollection.js.map