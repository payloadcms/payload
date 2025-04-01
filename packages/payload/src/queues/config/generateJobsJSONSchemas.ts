// @ts-strict-ignore
import type { I18n } from '@payloadcms/translations'
import type { JSONSchema4 } from 'json-schema'

import type { SanitizedConfig } from '../../config/types.js'
import type { JobsConfig } from './types/index.js'

import { fieldsToJSONSchema } from '../../utilities/configToJSONSchema.js'
import { flattenAllFields } from '../../utilities/flattenAllFields.js'
export function generateJobsJSONSchemas(
  config: SanitizedConfig,
  jobsConfig: JobsConfig,
  interfaceNameDefinitions: Map<string, JSONSchema4>,
  /**
   * Used for relationship fields, to determine whether to use a string or number type for the ID.
   * While there is a default ID field type set by the db adapter, they can differ on a collection-level
   * if they have custom ID fields.
   */
  collectionIDFieldTypes: { [key: string]: 'number' | 'string' },
  i18n?: I18n,
): {
  definitions?: Map<string, JSONSchema4>
  properties?: { tasks: JSONSchema4 }
} {
  const properties: { tasks: JSONSchema4; workflows: JSONSchema4 } = {
    tasks: {},
    workflows: {},
  }
  const definitions: Map<string, JSONSchema4> = new Map()

  if (jobsConfig?.tasks?.length) {
    for (const task of jobsConfig.tasks) {
      const fullTaskJsonSchema: JSONSchema4 = {
        type: 'object',
        additionalProperties: false,
        properties: {
          input: {},
          output: {},
        },
        required: [],
      }
      if (task?.inputSchema?.length) {
        const inputJsonSchema = fieldsToJSONSchema(
          collectionIDFieldTypes,
          flattenAllFields({ fields: task.inputSchema }),
          interfaceNameDefinitions,
          config,
          i18n,
        )

        const fullInputJsonSchema: JSONSchema4 = {
          type: 'object',
          additionalProperties: false,
          properties: inputJsonSchema.properties,
          required: inputJsonSchema.required,
        }

        fullTaskJsonSchema.properties.input = fullInputJsonSchema
        ;(fullTaskJsonSchema.required as string[]).push('input')
      }
      if (task?.outputSchema?.length) {
        const outputJsonSchema = fieldsToJSONSchema(
          collectionIDFieldTypes,
          flattenAllFields({ fields: task.outputSchema }),
          interfaceNameDefinitions,
          config,
          i18n,
        )

        const fullOutputJsonSchema: JSONSchema4 = {
          type: 'object',
          additionalProperties: false,
          properties: outputJsonSchema.properties,
          required: outputJsonSchema.required,
        }

        fullTaskJsonSchema.properties.output = fullOutputJsonSchema
        ;(fullTaskJsonSchema.required as string[]).push('output')
      }

      const normalizedTaskSlug = task.slug[0].toUpperCase() + task.slug.slice(1)

      definitions.set(task.interfaceName ?? `Task${normalizedTaskSlug}`, fullTaskJsonSchema)
    }
    // Now add properties.tasks definition that references the types in definitions keyed by task slug:
    properties.tasks = {
      type: 'object',
      additionalProperties: false,
      properties: {
        ...Object.fromEntries(
          jobsConfig.tasks.map((task) => {
            const normalizedTaskSlug = task.slug[0].toUpperCase() + task.slug.slice(1)

            const toReturn: JSONSchema4 = {
              $ref: task.interfaceName
                ? `#/definitions/${task.interfaceName}`
                : `#/definitions/Task${normalizedTaskSlug}`,
            }

            return [task.slug, toReturn]
          }),
        ),
        inline: {
          type: 'object',
          additionalProperties: false,
          properties: {
            input: {},
            output: {},
          },
          required: ['input', 'output'],
        },
      },
      required: [...jobsConfig.tasks.map((task) => task.slug), 'inline'],
    }
  }

  if (jobsConfig?.workflows?.length) {
    for (const workflow of jobsConfig.workflows) {
      const fullWorkflowJsonSchema: JSONSchema4 = {
        type: 'object',
        additionalProperties: false,
        properties: {
          input: {},
        },
        required: [],
      }

      if (workflow?.inputSchema?.length) {
        const inputJsonSchema = fieldsToJSONSchema(
          collectionIDFieldTypes,
          flattenAllFields({ fields: workflow.inputSchema }),
          interfaceNameDefinitions,
          config,
          i18n,
        )

        const fullInputJsonSchema: JSONSchema4 = {
          type: 'object',
          additionalProperties: false,
          properties: inputJsonSchema.properties,
          required: inputJsonSchema.required,
        }

        fullWorkflowJsonSchema.properties.input = fullInputJsonSchema
        ;(fullWorkflowJsonSchema.required as string[]).push('input')
      }
      const normalizedWorkflowSlug = workflow.slug[0].toUpperCase() + workflow.slug.slice(1)

      definitions.set(
        workflow.interfaceName ?? `Workflow${normalizedWorkflowSlug}`,
        fullWorkflowJsonSchema,
      )

      properties.workflows = {
        type: 'object',
        additionalProperties: false,
        properties: Object.fromEntries(
          jobsConfig.workflows.map((workflow) => {
            const normalizedWorkflowSlug = workflow.slug[0].toUpperCase() + workflow.slug.slice(1)

            const toReturn: JSONSchema4 = {
              $ref: workflow.interfaceName
                ? `#/definitions/${workflow.interfaceName}`
                : `#/definitions/Workflow${normalizedWorkflowSlug}`,
            }

            return [workflow.slug, toReturn]
          }),
        ),
        required: jobsConfig.workflows.map((workflow) => workflow.slug),
      }
    }
  }

  return {
    definitions,
    properties,
  }
}
