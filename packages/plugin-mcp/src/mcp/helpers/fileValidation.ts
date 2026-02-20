import type { CollectionConfig } from 'payload'

import { existsSync } from 'fs'
import { join } from 'path'

export type ValidationType = 'collection' | 'task' | 'workflow'

export interface ValidationResult<T = unknown> {
  config?: T
  error?: string
  success: boolean
}

// Custom task config interface that matches what we're creating
export interface TaskConfig {
  handler: (args: {
    input: Record<string, unknown>
    job: Record<string, unknown>
    tasks: Record<string, unknown>
  }) => Record<string, unknown>
  inputSchema?: Array<{
    label?: string
    name: string
    options?: Array<{ label: string; value: string }>
    required?: boolean
    type: string
  }>
  label?: string
  outputSchema?: Array<{
    label?: string
    name: string
    options?: Array<{ label: string; value: string }>
    required?: boolean
    type: string
  }>
  retries?: number
  slug: string
}

// Custom workflow config interface that matches what we're creating
export interface WorkflowConfig {
  handler: (args: {
    input: Record<string, unknown>
    job: Record<string, unknown>
    tasks: Record<string, unknown>
  }) => void
  inputSchema?: Array<{
    label?: string
    name: string
    options?: Array<{ label: string; value: string }>
    required?: boolean
    type: string
  }>
  label?: string
  queue?: string
  retries?: number
  slug: string
}

/**
 * Generic validation function for Payload configuration files
 * @param fileName - The name of the file (e.g., 'Users.ts', 'my-task.ts')
 * @param type - The type of validation to perform ('collection', 'task', or 'workflow')
 * @returns Object containing success status and any error messages
 */
export const validatePayloadFile = async <T = CollectionConfig | TaskConfig | WorkflowConfig>(
  fileName: string,
  type: ValidationType,
): Promise<ValidationResult<T>> => {
  try {
    const basePath = type === 'collection' ? 'collections' : type === 'task' ? 'tasks' : 'workflows'
    const fullPath = join(process.cwd(), 'src', basePath)
    const filePath = join(fullPath, fileName)

    // Check if file exists
    if (!existsSync(filePath)) {
      return {
        error: `${type} file does not exist: ${fileName}`,
        success: false,
      }
    }

    // Clear require cache to ensure fresh import
    delete require.cache[filePath]

    // Use relative path for webpack compatibility
    const moduleName = fileName.replace('.ts', '')
    const relativePath = `../${basePath}/${moduleName}`

    // Dynamic import with relative path
    const importedModule = await import(/* webpackIgnore: true */ relativePath)

    // Get the configuration based on type
    let config: T | undefined

    if (type === 'collection') {
      config = getCollectionConfig(importedModule, moduleName) as T
    } else if (type === 'task') {
      config = getTaskConfig(importedModule) as T
    } else if (type === 'workflow') {
      config = getWorkflowConfig(importedModule) as T
    }

    if (!config) {
      return {
        error: `${type} file does not export a valid ${type} config`,
        success: false,
      }
    }

    // Validate the configuration
    let validationResult: ValidationResult<unknown>
    if (type === 'collection') {
      validationResult = validateCollectionConfig(config as unknown as CollectionConfig)
    } else if (type === 'task') {
      validationResult = validateTaskConfig(config as unknown as TaskConfig)
    } else if (type === 'workflow') {
      validationResult = validateWorkflowConfig(config as unknown as WorkflowConfig)
    } else {
      return {
        error: `Unknown validation type: ${type}`,
        success: false,
      }
    }

    if (!validationResult.success) {
      return validationResult as ValidationResult<T>
    }

    return {
      config,
      success: true,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during validation'
    return {
      error: `Failed to validate ${type} file: ${errorMessage}`,
      success: false,
    }
  }
}

/**
 * Extract collection configuration from module exports
 */
function getCollectionConfig(
  importedModule: Record<string, unknown>,
  moduleName: string,
): CollectionConfig | undefined {
  if (importedModule.default) {
    return importedModule.default as CollectionConfig
  }

  if (importedModule[moduleName]) {
    return importedModule[moduleName] as CollectionConfig
  }

  return undefined
}

/**
 * Extract task configuration from module exports
 */
function getTaskConfig(importedModule: Record<string, unknown>): TaskConfig | undefined {
  // First check for default export
  if (importedModule.default) {
    return importedModule.default as TaskConfig
  }

  // Look for named exports ending with "Task"
  const exportNames = Object.keys(importedModule)
  const taskExport = exportNames.find((name) => name.endsWith('Task'))

  if (taskExport) {
    return importedModule[taskExport] as TaskConfig
  }

  return undefined
}

/**
 * Extract workflow configuration from module exports
 */
function getWorkflowConfig(importedModule: Record<string, unknown>): undefined | WorkflowConfig {
  // First check for default export
  if (importedModule.default) {
    return importedModule.default as WorkflowConfig
  }

  // Look for named exports ending with "Workflow"
  const exportNames = Object.keys(importedModule)
  const workflowExport = exportNames.find((name) => name.endsWith('Workflow'))

  if (workflowExport) {
    return importedModule[workflowExport] as WorkflowConfig
  }

  return undefined
}

/**
 * Validate collection configuration structure
 */
function validateCollectionConfig(config: CollectionConfig): ValidationResult<CollectionConfig> {
  if (!config) {
    return {
      error: 'Collection config is not a valid object',
      success: false,
    }
  }

  if (!config.slug) {
    return {
      error: 'Collection config must have a valid slug property',
      success: false,
    }
  }

  // Validate each field has required properties
  if (config.fields) {
    for (let i = 0; i < config.fields.length; i++) {
      const field = config.fields[i] as Record<string, unknown>
      if (!field) {
        return {
          error: `Field at index ${i} is not a valid object`,
          success: false,
        }
      }

      // Check if field has type property
      if ('type' in field && field.type) {
        return {
          error: `Field at index ${i} has invalid type property`,
          success: false,
        }
      }
    }
  }

  return { config, success: true }
}

/**
 * Validate task configuration structure
 */
function validateTaskConfig(config: TaskConfig): ValidationResult<TaskConfig> {
  if (!config) {
    return {
      error: 'Task config is not a valid object',
      success: false,
    }
  }

  if (!config.slug) {
    return {
      error: 'Task config must have a valid slug property',
      success: false,
    }
  }

  if (!config.handler) {
    return {
      error: 'Task config must have a valid handler function',
      success: false,
    }
  }

  // Validate optional properties
  if (config.retries !== undefined && config.retries < 0) {
    return {
      error: 'Task config retries must be a non-negative number',
      success: false,
    }
  }

  // Validate schemas if present
  if (config.inputSchema && Array.isArray(config.inputSchema)) {
    for (let i = 0; i < config.inputSchema.length; i++) {
      const field = config.inputSchema[i]
      if (!field) {
        return {
          error: `Input schema field at index ${i} is not a valid object`,
          success: false,
        }
      }

      if (!field.name) {
        return {
          error: `Input schema field at index ${i} must have a valid name property`,
          success: false,
        }
      }

      if (!field.type) {
        return {
          error: `Input schema field at index ${i} must have a valid type property`,
          success: false,
        }
      }
    }
  }

  if (config.outputSchema && Array.isArray(config.outputSchema)) {
    for (let i = 0; i < config.outputSchema.length; i++) {
      const field = config.outputSchema[i]
      if (!field) {
        return {
          error: `Output schema field at index ${i} is not a valid object`,
          success: false,
        }
      }

      if (!field.name) {
        return {
          error: `Output schema field at index ${i} must have a valid name property`,
          success: false,
        }
      }

      if (!field.type) {
        return {
          error: `Output schema field at index ${i} must have a valid type property`,
          success: false,
        }
      }
    }
  }

  return { config, success: true }
}

/**
 * Validate workflow configuration structure
 */
function validateWorkflowConfig(config: WorkflowConfig): ValidationResult<WorkflowConfig> {
  if (!config) {
    return {
      error: 'Workflow config is not a valid object',
      success: false,
    }
  }

  if (!config.slug) {
    return {
      error: 'Workflow config must have a valid slug property',
      success: false,
    }
  }

  if (!config.handler) {
    return {
      error: 'Workflow config must have a valid handler function',
      success: false,
    }
  }

  // Validate optional properties
  if (config.queue) {
    return {
      error: 'Workflow config queue must be a string',
      success: false,
    }
  }

  if (config.retries !== undefined && config.retries < 0) {
    return {
      error: 'Workflow config retries must be a non-negative number',
      success: false,
    }
  }

  // Validate schema if present
  if (config.inputSchema && Array.isArray(config.inputSchema)) {
    for (let i = 0; i < config.inputSchema.length; i++) {
      const field = config.inputSchema[i]
      if (!field) {
        return {
          error: `Input schema field at index ${i} is not a valid object`,
          success: false,
        }
      }

      if (!field.name) {
        return {
          error: `Input schema field at index ${i} must have a valid name property`,
          success: false,
        }
      }

      if (!field.type) {
        return {
          error: `Input schema field at index ${i} must have a valid type property`,
          success: false,
        }
      }
    }
  }

  return { config, success: true }
}

// Convenience functions for backward compatibility
export const validateCollectionFile = async (
  fileName: string,
): Promise<ValidationResult<CollectionConfig>> => {
  return validatePayloadFile<CollectionConfig>(fileName, 'collection')
}

export const validateTaskFile = async (fileName: string): Promise<ValidationResult<TaskConfig>> => {
  return validatePayloadFile<TaskConfig>(fileName, 'task')
}

export const validateWorkflowFile = async (
  fileName: string,
): Promise<ValidationResult<WorkflowConfig>> => {
  return validatePayloadFile<WorkflowConfig>(fileName, 'workflow')
}
