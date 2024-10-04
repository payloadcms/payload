import type { JSONSchema4 } from 'json-schema'

import type { SanitizedConfig } from '../../config/types.js'
import type { JobsConfig } from './types/index.js'

import { fieldsToJSONSchema } from '../../utilities/configToJSONSchema.js'

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
      if (task?.inputSchema?.length) {
        const inputJsonSchema = fieldsToJSONSchema(
          collectionIDFieldTypes,
          task.inputSchema,
          interfaceNameDefinitions,
          config,
        )

        const fullInputJsonSchema: JSONSchema4 = {
          type: 'object',
          additionalProperties: false,
          properties: inputJsonSchema.properties,
          required: inputJsonSchema.required,
        }

        definitions.set(`Task${task.slug}Input`, fullInputJsonSchema)
      }
      if (task?.outputSchema?.length) {
        const outputJsonSchema = fieldsToJSONSchema(
          collectionIDFieldTypes,
          task.outputSchema,
          interfaceNameDefinitions,
          config,
        )

        const fullOutputJsonSchema: JSONSchema4 = {
          type: 'object',
          additionalProperties: false,
          properties: outputJsonSchema.properties,
          required: outputJsonSchema.required,
        }

        definitions.set(`Task${task.slug}Output`, fullOutputJsonSchema)
      }
    }
    // Now add properties.tasks definition that references the types in definitions keyed by task slug:
    properties.tasks = {
      type: 'object',
      additionalProperties: false,
      properties: Object.fromEntries(
        jobsConfig.tasks.map((task) => {
          const toReturn: JSONSchema4 = {
            type: 'object',
            additionalProperties: false,
            properties: {
              input: {},
            },
            required: ['input', 'output'],
          }

          if (task.inputSchema?.length) {
            ;(toReturn.required as string[]).push('input')
            toReturn.properties.input = {
              $ref: `#/definitions/Task${task.slug}Input`,
            }
          }
          if (task.outputSchema?.length) {
            ;(toReturn.required as string[]).push('output')
            toReturn.properties.output = {
              $ref: `#/definitions/Task${task.slug}Output`,
            }
          }
          return [task.slug, toReturn]
        }),
      ),
      required: jobsConfig.tasks.map((task) => task.slug),
    }
  }

  if (jobsConfig?.workflows?.length) {
    for (const workflow of jobsConfig.workflows) {
      if (workflow?.inputSchema?.length) {
        const inputJsonSchema = fieldsToJSONSchema(
          collectionIDFieldTypes,
          workflow.inputSchema,
          interfaceNameDefinitions,
          config,
        )

        const fullInputJsonSchema: JSONSchema4 = {
          type: 'object',
          additionalProperties: false,
          properties: inputJsonSchema.properties,
          required: inputJsonSchema.required,
        }

        definitions.set(`Workflow${workflow.slug}Input`, fullInputJsonSchema)
      }

      properties.workflows = {
        type: 'object',
        additionalProperties: false,
        properties: Object.fromEntries(
          jobsConfig.workflows.map((workflow) => {
            const toReturn: JSONSchema4 = {
              type: 'object',
              additionalProperties: false,
              properties: {
                input: {},
              },
              required: ['input'],
            }

            if (workflow.inputSchema?.length) {
              ;(toReturn.required as string[]).push('input')
              toReturn.properties.input = {
                $ref: `#/definitions/Workflow${workflow.slug}Input`,
              }
            }

            return [workflow.slug, toReturn]
          }),
        ),
        required: jobsConfig.tasks.map((task) => task.slug),
      }
    }
  }

  return {
    definitions,
    properties,
  }
}
