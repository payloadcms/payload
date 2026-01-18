import { existsSync } from 'fs';
import { join } from 'path';
/**
 * Generic validation function for Payload configuration files
 * @param fileName - The name of the file (e.g., 'Users.ts', 'my-task.ts')
 * @param type - The type of validation to perform ('collection', 'task', or 'workflow')
 * @returns Object containing success status and any error messages
 */ export const validatePayloadFile = async (fileName, type)=>{
    try {
        const basePath = type === 'collection' ? 'collections' : type === 'task' ? 'tasks' : 'workflows';
        const fullPath = join(process.cwd(), 'src', basePath);
        const filePath = join(fullPath, fileName);
        // Check if file exists
        if (!existsSync(filePath)) {
            return {
                error: `${type} file does not exist: ${fileName}`,
                success: false
            };
        }
        // Clear require cache to ensure fresh import
        delete require.cache[filePath];
        // Use relative path for webpack compatibility
        const moduleName = fileName.replace('.ts', '');
        const relativePath = `../${basePath}/${moduleName}`;
        // Dynamic import with relative path
        const importedModule = await import(/* webpackIgnore: true */ relativePath);
        // Get the configuration based on type
        let config;
        if (type === 'collection') {
            config = getCollectionConfig(importedModule, moduleName);
        } else if (type === 'task') {
            config = getTaskConfig(importedModule);
        } else if (type === 'workflow') {
            config = getWorkflowConfig(importedModule);
        }
        if (!config) {
            return {
                error: `${type} file does not export a valid ${type} config`,
                success: false
            };
        }
        // Validate the configuration
        let validationResult;
        if (type === 'collection') {
            validationResult = validateCollectionConfig(config);
        } else if (type === 'task') {
            validationResult = validateTaskConfig(config);
        } else if (type === 'workflow') {
            validationResult = validateWorkflowConfig(config);
        } else {
            return {
                error: `Unknown validation type: ${type}`,
                success: false
            };
        }
        if (!validationResult.success) {
            return validationResult;
        }
        return {
            config,
            success: true
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during validation';
        return {
            error: `Failed to validate ${type} file: ${errorMessage}`,
            success: false
        };
    }
};
/**
 * Extract collection configuration from module exports
 */ function getCollectionConfig(importedModule, moduleName) {
    if (importedModule.default) {
        return importedModule.default;
    }
    if (importedModule[moduleName]) {
        return importedModule[moduleName];
    }
    return undefined;
}
/**
 * Extract task configuration from module exports
 */ function getTaskConfig(importedModule) {
    // First check for default export
    if (importedModule.default) {
        return importedModule.default;
    }
    // Look for named exports ending with "Task"
    const exportNames = Object.keys(importedModule);
    const taskExport = exportNames.find((name)=>name.endsWith('Task'));
    if (taskExport) {
        return importedModule[taskExport];
    }
    return undefined;
}
/**
 * Extract workflow configuration from module exports
 */ function getWorkflowConfig(importedModule) {
    // First check for default export
    if (importedModule.default) {
        return importedModule.default;
    }
    // Look for named exports ending with "Workflow"
    const exportNames = Object.keys(importedModule);
    const workflowExport = exportNames.find((name)=>name.endsWith('Workflow'));
    if (workflowExport) {
        return importedModule[workflowExport];
    }
    return undefined;
}
/**
 * Validate collection configuration structure
 */ function validateCollectionConfig(config) {
    if (!config) {
        return {
            error: 'Collection config is not a valid object',
            success: false
        };
    }
    if (!config.slug) {
        return {
            error: 'Collection config must have a valid slug property',
            success: false
        };
    }
    // Validate each field has required properties
    if (config.fields) {
        for(let i = 0; i < config.fields.length; i++){
            const field = config.fields[i];
            if (!field) {
                return {
                    error: `Field at index ${i} is not a valid object`,
                    success: false
                };
            }
            // Check if field has type property
            if ('type' in field && field.type) {
                return {
                    error: `Field at index ${i} has invalid type property`,
                    success: false
                };
            }
        }
    }
    return {
        config,
        success: true
    };
}
/**
 * Validate task configuration structure
 */ function validateTaskConfig(config) {
    if (!config) {
        return {
            error: 'Task config is not a valid object',
            success: false
        };
    }
    if (!config.slug) {
        return {
            error: 'Task config must have a valid slug property',
            success: false
        };
    }
    if (!config.handler) {
        return {
            error: 'Task config must have a valid handler function',
            success: false
        };
    }
    // Validate optional properties
    if (config.retries !== undefined && config.retries < 0) {
        return {
            error: 'Task config retries must be a non-negative number',
            success: false
        };
    }
    // Validate schemas if present
    if (config.inputSchema && Array.isArray(config.inputSchema)) {
        for(let i = 0; i < config.inputSchema.length; i++){
            const field = config.inputSchema[i];
            if (!field) {
                return {
                    error: `Input schema field at index ${i} is not a valid object`,
                    success: false
                };
            }
            if (!field.name) {
                return {
                    error: `Input schema field at index ${i} must have a valid name property`,
                    success: false
                };
            }
            if (!field.type) {
                return {
                    error: `Input schema field at index ${i} must have a valid type property`,
                    success: false
                };
            }
        }
    }
    if (config.outputSchema && Array.isArray(config.outputSchema)) {
        for(let i = 0; i < config.outputSchema.length; i++){
            const field = config.outputSchema[i];
            if (!field) {
                return {
                    error: `Output schema field at index ${i} is not a valid object`,
                    success: false
                };
            }
            if (!field.name) {
                return {
                    error: `Output schema field at index ${i} must have a valid name property`,
                    success: false
                };
            }
            if (!field.type) {
                return {
                    error: `Output schema field at index ${i} must have a valid type property`,
                    success: false
                };
            }
        }
    }
    return {
        config,
        success: true
    };
}
/**
 * Validate workflow configuration structure
 */ function validateWorkflowConfig(config) {
    if (!config) {
        return {
            error: 'Workflow config is not a valid object',
            success: false
        };
    }
    if (!config.slug) {
        return {
            error: 'Workflow config must have a valid slug property',
            success: false
        };
    }
    if (!config.handler) {
        return {
            error: 'Workflow config must have a valid handler function',
            success: false
        };
    }
    // Validate optional properties
    if (config.queue) {
        return {
            error: 'Workflow config queue must be a string',
            success: false
        };
    }
    if (config.retries !== undefined && config.retries < 0) {
        return {
            error: 'Workflow config retries must be a non-negative number',
            success: false
        };
    }
    // Validate schema if present
    if (config.inputSchema && Array.isArray(config.inputSchema)) {
        for(let i = 0; i < config.inputSchema.length; i++){
            const field = config.inputSchema[i];
            if (!field) {
                return {
                    error: `Input schema field at index ${i} is not a valid object`,
                    success: false
                };
            }
            if (!field.name) {
                return {
                    error: `Input schema field at index ${i} must have a valid name property`,
                    success: false
                };
            }
            if (!field.type) {
                return {
                    error: `Input schema field at index ${i} must have a valid type property`,
                    success: false
                };
            }
        }
    }
    return {
        config,
        success: true
    };
}
// Convenience functions for backward compatibility
export const validateCollectionFile = async (fileName)=>{
    return validatePayloadFile(fileName, 'collection');
};
export const validateTaskFile = async (fileName)=>{
    return validatePayloadFile(fileName, 'task');
};
export const validateWorkflowFile = async (fileName)=>{
    return validatePayloadFile(fileName, 'workflow');
};

//# sourceMappingURL=fileValidation.js.map