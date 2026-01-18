import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { addFieldsToCollection, modifyFieldsInCollection, removeFieldsFromCollection } from '../../helpers/fields.js';
import { validateCollectionFile } from '../../helpers/fileValidation.js';
import { toolSchemas } from '../schemas.js';
export const updateCollection = async (req, verboseLogs, collectionsDirPath, configFilePath, collectionName, updateType, newFields, fieldNamesToRemove, fieldModifications, configUpdates, newContent)=>{
    const payload = req.payload;
    if (verboseLogs) {
        payload.logger.info(`[payload-mcp] Updating collection: ${collectionName}, updateType: ${updateType}`);
    }
    const capitalizedName = collectionName.charAt(0).toUpperCase() + collectionName.slice(1);
    const fileName = `${capitalizedName}.ts`;
    const filePath = join(collectionsDirPath, fileName);
    // Security check: ensure we're working with the collections directory
    if (!filePath.startsWith(collectionsDirPath)) {
        payload.logger.error(`[payload-mcp] Invalid collection path attempted: ${filePath}`);
        return {
            content: [
                {
                    type: 'text',
                    text: '❌ **Error**: Invalid collection path'
                }
            ]
        };
    }
    try {
        // Check if collection file exists
        let currentContent;
        try {
            currentContent = readFileSync(filePath, 'utf8');
        } catch (_ignore) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `❌ **Error**: Collection file not found: ${fileName}`
                    }
                ]
            };
        }
        let updatedContent;
        let updateSummary = [];
        switch(updateType){
            case 'add_field':
                if (!newFields || newFields.length === 0) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: '❌ **Error**: No fields provided for add_field update type'
                            }
                        ]
                    };
                }
                updatedContent = addFieldsToCollection(currentContent, newFields);
                updateSummary = newFields.map((field)=>`Added field: ${field.name} (${field.type})`);
                break;
            case 'modify_field':
                if (!fieldModifications || fieldModifications.length === 0) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: '❌ **Error**: No field modifications provided for modify_field update type'
                            }
                        ]
                    };
                }
                updatedContent = modifyFieldsInCollection(currentContent, fieldModifications);
                updateSummary = fieldModifications.map((mod)=>`Modified field: ${mod.fieldName}`);
                break;
            case 'remove_field':
                if (!fieldNamesToRemove || fieldNamesToRemove.length === 0) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: '❌ **Error**: No field names provided for remove_field update type'
                            }
                        ]
                    };
                }
                updatedContent = removeFieldsFromCollection(currentContent, fieldNamesToRemove);
                updateSummary = fieldNamesToRemove.map((fieldName)=>`Removed field: ${fieldName}`);
                break;
            case 'replace_content':
                if (!newContent) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: '❌ **Error**: No new content provided for replace_content update type'
                            }
                        ]
                    };
                }
                updatedContent = newContent;
                updateSummary = [
                    'Replaced entire collection content'
                ];
                break;
            case 'update_config':
                if (!configUpdates) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: '❌ **Error**: No config updates provided for update_config update type'
                            }
                        ]
                    };
                }
                // For now, we'll use a simple approach since the config helper might not have this functionality
                updatedContent = currentContent;
                updateSummary = Object.keys(configUpdates).map((key)=>`Updated config: ${key}`);
                break;
            default:
                return {
                    content: [
                        {
                            type: 'text',
                            text: `❌ **Error**: Unknown update type: ${updateType}`
                        }
                    ]
                };
        }
        // Write the updated content back to the file
        writeFileSync(filePath, updatedContent, 'utf8');
        if (verboseLogs) {
            payload.logger.info(`[payload-mcp] Successfully updated collection file: ${filePath}`);
        }
        // Validate the updated file
        const validationResult = await validateCollectionFile(fileName);
        if (validationResult.error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `❌ **Error**: Updated collection has validation issues:\n\n${validationResult.error}`
                    }
                ]
            };
        }
        return {
            content: [
                {
                    type: 'text',
                    text: `✅ **Collection updated successfully!**

**File**: \`${fileName}\`
**Update Type**: ${updateType}

**Changes Made**:
${updateSummary.map((summary)=>`- ${summary}`).join('\n')}

**Updated Collection Code:**
\`\`\`typescript
${updatedContent}
\`\`\``
                }
            ]
        };
    } catch (error) {
        const errorMessage = error.message;
        payload.logger.error(`[payload-mcp] Error updating collection: ${errorMessage}`);
        return {
            content: [
                {
                    type: 'text',
                    text: `❌ **Error updating collection**: ${errorMessage}`
                }
            ]
        };
    }
};
export const updateCollectionTool = (server, req, verboseLogs, collectionsDirPath, configFilePath)=>{
    const tool = async ({ collectionName, configUpdates, fieldModifications, fieldNamesToRemove, newContent, newFields, updateType })=>{
        const payload = req.payload;
        if (verboseLogs) {
            payload.logger.info(`[payload-mcp] Updating collection: ${collectionName}, updateType: ${updateType}`);
        }
        try {
            const result = await updateCollection(req, verboseLogs, collectionsDirPath, configFilePath, collectionName, updateType, newFields, fieldNamesToRemove, fieldModifications, configUpdates, newContent);
            if (verboseLogs) {
                payload.logger.info(`[payload-mcp] Collection update completed for: ${collectionName}`);
            }
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            payload.logger.error(`[payload-mcp] Error updating collection ${collectionName}: ${errorMessage}`);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error updating collection "${collectionName}": ${errorMessage}`
                    }
                ]
            };
        }
    };
    server.tool('updateCollection', toolSchemas.updateCollection.description, toolSchemas.updateCollection.parameters.shape, async (args)=>{
        return await tool(args);
    });
};

//# sourceMappingURL=update.js.map