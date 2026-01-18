import type { CollectionConfig } from 'payload';
export type ValidationType = 'collection' | 'task' | 'workflow';
export interface ValidationResult<T = unknown> {
    config?: T;
    error?: string;
    success: boolean;
}
export interface TaskConfig {
    handler: (args: {
        input: Record<string, unknown>;
        job: Record<string, unknown>;
        tasks: Record<string, unknown>;
    }) => Record<string, unknown>;
    inputSchema?: Array<{
        label?: string;
        name: string;
        options?: Array<{
            label: string;
            value: string;
        }>;
        required?: boolean;
        type: string;
    }>;
    label?: string;
    outputSchema?: Array<{
        label?: string;
        name: string;
        options?: Array<{
            label: string;
            value: string;
        }>;
        required?: boolean;
        type: string;
    }>;
    retries?: number;
    slug: string;
}
export interface WorkflowConfig {
    handler: (args: {
        input: Record<string, unknown>;
        job: Record<string, unknown>;
        tasks: Record<string, unknown>;
    }) => void;
    inputSchema?: Array<{
        label?: string;
        name: string;
        options?: Array<{
            label: string;
            value: string;
        }>;
        required?: boolean;
        type: string;
    }>;
    label?: string;
    queue?: string;
    retries?: number;
    slug: string;
}
/**
 * Generic validation function for Payload configuration files
 * @param fileName - The name of the file (e.g., 'Users.ts', 'my-task.ts')
 * @param type - The type of validation to perform ('collection', 'task', or 'workflow')
 * @returns Object containing success status and any error messages
 */
export declare const validatePayloadFile: <T = CollectionConfig | TaskConfig | WorkflowConfig>(fileName: string, type: ValidationType) => Promise<ValidationResult<T>>;
export declare const validateCollectionFile: (fileName: string) => Promise<ValidationResult<CollectionConfig>>;
export declare const validateTaskFile: (fileName: string) => Promise<ValidationResult<TaskConfig>>;
export declare const validateWorkflowFile: (fileName: string) => Promise<ValidationResult<WorkflowConfig>>;
//# sourceMappingURL=fileValidation.d.ts.map