import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { validatePayloadFile } from '../../helpers/fileValidation.js';
import { toolSchemas } from '../schemas.js';
// Reusable function for updating jobs
export const updateJob = async (req, verboseLogs, jobsDir, jobSlug, updateType, inputSchema, outputSchema, taskSequence, configUpdate, handlerCode)=>{
    const payload = req.payload;
    if (verboseLogs) {
        payload.logger.info(`[payload-mcp] Updating job: ${jobSlug} (${updateType})`);
    }
    try {
        const camelCaseJobSlug = toCamelCase(jobSlug);
        // Find the job file - check both tasks and workflows
        let filePath = null;
        let jobType = null;
        const taskPath = join(jobsDir, 'tasks', `${camelCaseJobSlug}.ts`);
        const workflowPath = join(jobsDir, 'workflows', `${camelCaseJobSlug}.ts`);
        if (existsSync(taskPath)) {
            filePath = taskPath;
            jobType = 'task';
            if (verboseLogs) {
                payload.logger.info(`[payload-mcp] Found task file: ${taskPath}`);
            }
        } else if (existsSync(workflowPath)) {
            filePath = workflowPath;
            jobType = 'workflow';
            if (verboseLogs) {
                payload.logger.info(`[payload-mcp] Found workflow file: ${workflowPath}`);
            }
        } else {
            throw new Error(`No task or workflow file found for job slug: ${jobSlug}`);
        }
        // Read the current file content
        let content = readFileSync(filePath, 'utf8');
        const originalContent = content;
        if (verboseLogs) {
            payload.logger.info(`[payload-mcp] Applying update type: ${updateType}`);
        }
        // Apply updates based on type
        switch(updateType){
            case 'change_config':
                if (!configUpdate) {
                    throw new Error('config must be provided for change_config');
                }
                content = updateConfig(content, jobSlug, configUpdate);
                if (verboseLogs) {
                    payload.logger.info(`[payload-mcp] Configuration updated successfully`);
                }
                break;
            case 'modify_schema':
                if (!inputSchema && !outputSchema) {
                    throw new Error('Either inputSchema or outputSchema must be provided for modify_schema');
                }
                content = updateSchema(content, camelCaseJobSlug, inputSchema, outputSchema);
                if (verboseLogs) {
                    payload.logger.info(`[payload-mcp] Schema updated successfully`);
                }
                break;
            case 'replace_handler':
                if (!handlerCode) {
                    throw new Error('handlerCode must be provided for replace_handler');
                }
                content = updateHandler(content, handlerCode, jobType);
                if (verboseLogs) {
                    payload.logger.info(`[payload-mcp] Handler code replaced successfully`);
                }
                break;
            case 'update_tasks':
                if (!taskSequence) {
                    throw new Error('taskSequence must be provided for update_tasks');
                }
                if (jobType !== 'workflow') {
                    throw new Error('update_tasks is only supported for workflow jobs');
                }
                content = updateWorkflowTasks(content, taskSequence);
                if (verboseLogs) {
                    payload.logger.info(`[payload-mcp] Workflow tasks updated successfully`);
                }
                break;
        }
        // Only write if content changed
        if (content !== originalContent) {
            if (verboseLogs) {
                payload.logger.info(`[payload-mcp] Writing updated content to file`);
            }
            // Write the updated content
            writeFileSync(filePath, content);
            // Validate the updated file
            const fileName = `${camelCaseJobSlug}.ts`;
            const validationType = jobType === 'task' ? 'task' : 'workflow';
            try {
                const validationResult = await validatePayloadFile(fileName, validationType);
                if (!validationResult.success) {
                    if (verboseLogs) {
                        payload.logger.warn(`[payload-mcp] Validation warning: ${validationResult.error}`);
                    }
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `⚠️ **Warning**: Job updated but validation failed:\n\n${validationResult.error}\n\nPlease review the generated code for any syntax errors.`
                            }
                        ]
                    };
                }
                if (verboseLogs) {
                    payload.logger.info(`[payload-mcp] File validation successful`);
                }
            } catch (validationError) {
                if (verboseLogs) {
                    payload.logger.warn(`[payload-mcp] Validation error: ${validationError}`);
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: `⚠️ **Warning**: Job updated but validation could not be completed:\n\n${validationError}\n\nPlease review the generated code manually.`
                        }
                    ]
                };
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: `✅ **Job updated successfully!**\n\n**Job**: \`${jobSlug}\`\n**Type**: \`${jobType}\`\n**Update**: \`${updateType}\`\n**File**: \`${fileName}\`\n\n**Next steps**:\n1. Restart your development server to load the updated job\n2. Test the updated functionality\n3. Verify the changes meet your requirements`
                    }
                ]
            };
        } else {
            if (verboseLogs) {
                payload.logger.info(`[payload-mcp] No changes detected, file not modified`);
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: `ℹ️ **No changes made**: The job file was not modified as no changes were detected.\n\n**Job**: \`${jobSlug}\`\n**Type**: \`${jobType}\`\n**Update**: \`${updateType}\``
                    }
                ]
            };
        }
    } catch (error) {
        const errorMessage = error.message;
        payload.logger.error(`[payload-mcp] Error updating job: ${errorMessage}`);
        return {
            content: [
                {
                    type: 'text',
                    text: `❌ **Error updating job**: ${errorMessage}`
                }
            ]
        };
    }
};
// Helper function to convert to camel case
function toCamelCase(str) {
    return str.replace(/[-_\s]+(.)?/g, (_, chr)=>chr ? chr.toUpperCase() : '').replace(/^(.)/, (_, chr)=>chr.toLowerCase());
}
// Helper functions for different update types
function updateSchema(content, camelCaseJobSlug, inputSchema, outputSchema) {
    // TODO: Implementation for schema updates
    // This would modify the inputSchema and outputSchema in the job file
    return content;
}
function updateWorkflowTasks(content, taskSequence) {
    // TODO: Implementation for updating workflow tasks
    // This would modify the steps array in the workflow
    return content;
}
function updateConfig(content, jobSlug, configUpdate) {
    // TODO: Implementation for updating job configuration
    // This would modify various config properties
    return content;
}
function updateHandler(content, handlerCode, jobType) {
    // TODO: Implementation for replacing handler code
    // This would replace the handler function in the job file
    return content;
}
export const updateJobTool = (server, req, verboseLogs, jobsDir)=>{
    const tool = async (jobSlug, updateType, inputSchema, outputSchema, taskSequence, configUpdate, handlerCode)=>{
        if (verboseLogs) {
            req.payload.logger.info(`[payload-mcp] Update Job Tool called with: ${jobSlug}, ${updateType}`);
        }
        try {
            const result = await updateJob(req, verboseLogs, jobsDir, jobSlug, updateType, inputSchema, outputSchema, taskSequence, configUpdate, handlerCode);
            if (verboseLogs) {
                req.payload.logger.info(`[payload-mcp] Update Job Tool completed successfully`);
            }
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            req.payload.logger.error(`[payload-mcp] Error in Update Job Tool: ${errorMessage}`);
            return {
                content: [
                    {
                        type: 'text',
                        text: `❌ **Error in Update Job Tool**: ${errorMessage}`
                    }
                ]
            };
        }
    };
    server.tool('updateJob', 'Updates an existing Payload job with new configuration, schema, or handler code', toolSchemas.updateJob.parameters.shape, async (args)=>{
        const { configUpdate, handlerCode, inputSchema, jobSlug, outputSchema, taskSequence, updateType } = args;
        return await tool(jobSlug, updateType, inputSchema, outputSchema, taskSequence, configUpdate, handlerCode);
    });
};

//# sourceMappingURL=update.js.map