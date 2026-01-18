/**
 * Adds a collection to the payload.config.ts file
 */ export function addCollectionToConfig(content, collectionName) {
    const capitalizedName = collectionName.charAt(0).toUpperCase() + collectionName.slice(1);
    // Add import statement
    const importRegex = /import.*from\s*['"]\.\/collections\/.*['"]/g;
    const importMatches = content.match(importRegex);
    if (importMatches && importMatches.length > 0) {
        const lastImport = importMatches[importMatches.length - 1];
        const newImport = `import { ${capitalizedName} } from './collections/${capitalizedName}'`;
        // Check if import already exists
        if (lastImport && !content.includes(newImport)) {
            content = content.replace(lastImport, `${lastImport}\n${newImport}`);
        }
    } else {
        // Add import after existing imports
        const importInsertPoint = content.indexOf("import sharp from 'sharp'");
        if (importInsertPoint !== -1) {
            const lineEnd = content.indexOf('\n', importInsertPoint);
            const newImport = `import { ${capitalizedName} } from './collections/${capitalizedName}'`;
            content = content.slice(0, lineEnd + 1) + newImport + '\n' + content.slice(lineEnd + 1);
        }
    }
    // Add to collections array
    const collectionsRegex = /collections:\s*\[([\s\S]*?)\]/;
    const collectionsMatch = content.match(collectionsRegex);
    if (collectionsMatch && collectionsMatch[1]) {
        const collectionsContent = collectionsMatch[1].trim();
        if (!collectionsContent.includes(capitalizedName)) {
            const newCollections = collectionsContent ? `${collectionsContent}, ${capitalizedName}` : capitalizedName;
            content = content.replace(collectionsRegex, `collections: [${newCollections}]`);
        }
    }
    return content;
}
/**
 * Removes a collection from the payload.config.ts file
 */ export function removeCollectionFromConfig(content, collectionName) {
    const capitalizedName = collectionName.charAt(0).toUpperCase() + collectionName.slice(1);
    // Remove import statement
    const importRegex = new RegExp(`import\\s*{\\s*${capitalizedName}\\s*}\\s*from\\s*['"]\\./collections/${capitalizedName}['"]\\s*\\n?`, 'g');
    content = content.replace(importRegex, '');
    // Remove from collections array
    const collectionsRegex = /collections:\s*\[([\s\S]*?)\]/;
    const collectionsMatch = content.match(collectionsRegex);
    if (collectionsMatch && collectionsMatch[1]) {
        let collectionsContent = collectionsMatch[1];
        // Remove the collection name and clean up commas
        collectionsContent = collectionsContent.replace(new RegExp(`\\s*,?\\s*${capitalizedName}\\s*,?`, 'g'), '');
        collectionsContent = collectionsContent.replace(/,\s*,/g, ','); // Remove double commas
        collectionsContent = collectionsContent.replace(/^\s*,|,\s*$/g, ''); // Remove leading/trailing commas
        content = content.replace(collectionsRegex, `collections: [${collectionsContent}]`);
    }
    // Clean up any double newlines from removed imports
    content = content.replace(/\n{3,}/g, '\n\n');
    return content;
}
/**
 * Updates admin configuration in payload.config.ts
 */ export function updateAdminConfig(content, adminConfig) {
    const adminRegex = /admin:\s*\{([^}]*)\}/;
    const adminMatch = content.match(adminRegex);
    if (adminMatch && adminMatch[1]) {
        let adminContent = adminMatch[1];
        // Update specific admin properties
        if (adminConfig.user) {
            if (adminContent.includes('user:')) {
                adminContent = adminContent.replace(/user:[^,}]*/, `user: ${adminConfig.user}.slug`);
            } else {
                adminContent = `\n    user: ${adminConfig.user}.slug,${adminContent}`;
            }
        }
        if (adminConfig.meta) {
            const metaConfig = Object.entries(adminConfig.meta).map(([key, value])=>`      ${key}: '${value}'`).join(',\n');
            if (adminContent.includes('meta:')) {
                adminContent = adminContent.replace(/meta:\s*\{[^}]*\}/, `meta: {\n${metaConfig}\n    }`);
            } else {
                adminContent = `${adminContent}\n    meta: {\n${metaConfig}\n    },`;
            }
        }
        content = content.replace(adminRegex, `admin: {${adminContent}\n  }`);
    } else {
        // Add admin config if it doesn't exist
        const adminConfigEntries = [];
        if (adminConfig.user) {
            adminConfigEntries.push(`    user: ${adminConfig.user}.slug`);
        }
        if (adminConfig.meta) {
            const metaConfig = Object.entries(adminConfig.meta).map(([key, value])=>`      ${key}: '${value}'`).join(',\n');
            adminConfigEntries.push(`    meta: {\n${metaConfig}\n    }`);
        }
        const adminConfigString = `admin: {\n${adminConfigEntries.join(',\n')}\n  },`;
        content = content.replace(/export default buildConfig\(\{/, `export default buildConfig({\n  ${adminConfigString}`);
    }
    return content;
}
/**
 * Updates database configuration in payload.config.ts
 */ export function updateDatabaseConfig(content, databaseConfig) {
    if (databaseConfig.type === 'mongodb') {
        // Update to MongoDB adapter
        const dbRegex = /db:[^,}]*(?:,|\})/;
        const mongoImportRegex = /import.*mongooseAdapter.*from.*@payloadcms\/db-mongodb.*/;
        if (!content.match(mongoImportRegex)) {
            content = content.replace(/(import.*from.*payload.*\n)/, `$1import { mongooseAdapter } from '@payloadcms/db-mongodb'\n`);
        }
        const dbConfig = `db: mongooseAdapter({\n    url: process.env.DATABASE_URL || '${databaseConfig.url || ''}',\n  })`;
        content = content.replace(dbRegex, `${dbConfig},`);
    }
    return content;
}
/**
 * Updates plugins configuration in payload.config.ts
 */ export function updatePluginsConfig(content, pluginUpdates) {
    // Add plugin imports
    if (pluginUpdates.add) {
        pluginUpdates.add.forEach((pluginImport)=>{
            if (!content.includes(pluginImport)) {
                content = content.replace(/(import.*from.*payload.*\n)/, `$1${pluginImport}\n`);
            }
        });
    }
    // Handle plugins array
    const pluginsRegex = /plugins:\s*\[([\s\S]*?)\]/;
    const pluginsMatch = content.match(pluginsRegex);
    if (pluginsMatch && pluginsMatch[1]) {
        let pluginsContent = pluginsMatch[1];
        // Remove plugins
        if (pluginUpdates.remove) {
            pluginUpdates.remove.forEach((pluginName)=>{
                const pluginRegex = new RegExp(`\\s*${pluginName}\\(\\)\\s*,?`, 'g');
                pluginsContent = pluginsContent.replace(pluginRegex, '');
            });
        }
        // Add plugins
        if (pluginUpdates.add) {
            pluginUpdates.add.forEach((pluginImport)=>{
                // This will match: import { PluginName } from '...';
                const match = pluginImport.match(/import\s*\{\s*(\w+)\s*\}/);
                if (match && match[1]) {
                    const pluginName = match[1];
                    if (!pluginsContent.includes(`${pluginName}(`)) {
                        pluginsContent = pluginsContent.trim() ? `${pluginsContent}\n    ${pluginName}(),` : `\n    ${pluginName}(),`;
                    }
                }
            });
        }
        content = content.replace(pluginsRegex, `plugins: [${pluginsContent}\n  ]`);
    }
    return content;
}
/**
 * Updates general configuration options in payload.config.ts
 */ export function updateGeneralConfig(content, generalConfig) {
    // Update various general configuration options
    Object.entries(generalConfig).forEach(([key, value])=>{
        if (value !== undefined && value !== null) {
            const configRegex = new RegExp(`${key}:\\s*[^,}]*`, 'g');
            if (content.match(configRegex)) {
                if (typeof value === 'string') {
                    content = content.replace(configRegex, `${key}: '${value}'`);
                } else if (typeof value === 'boolean') {
                    content = content.replace(configRegex, `${key}: ${value}`);
                } else if (typeof value === 'object') {
                    content = content.replace(configRegex, `${key}: ${JSON.stringify(value, null, 2)}`);
                }
            } else {
                // Add new config option
                const configValue = typeof value === 'string' ? `'${value}'` : typeof value === 'object' ? JSON.stringify(value, null, 2) : value;
                content = content.replace(/export default buildConfig\(\{/, `export default buildConfig({\n  ${key}: ${configValue},`);
            }
        }
    });
    return content;
}
/**
 * Updates collection-level configuration in a collection file
 */ export function updateCollectionConfig(content, updates, collectionName) {
    let updatedContent = content;
    if (updates.slug) {
        updatedContent = updatedContent.replace(/slug:\s*'[^']*'/, `slug: '${updates.slug}'`);
    }
    if (updates.access) {
        const accessRegex = /access:\s*\{[^}]*\}/;
        if (updatedContent.match(accessRegex)) {
            // Update existing access config
            Object.entries(updates.access).forEach(([key, value])=>{
                if (value !== undefined) {
                    updatedContent = updatedContent.replace(new RegExp(`${key}:\\s*[^,}]*`), `${key}: ${value}`);
                }
            });
        } else {
            // Add access config
            const accessConfig = Object.entries(updates.access).filter(([, value])=>value !== undefined).map(([key, value])=>`    ${key}: ${value}`).join(',\n');
            updatedContent = updatedContent.replace(/slug:\s*'[^']*',/, `slug: '${collectionName}',\n  access: {\n${accessConfig}\n  },`);
        }
    }
    if (updates.timestamps !== undefined) {
        if (updatedContent.includes('timestamps:')) {
            updatedContent = updatedContent.replace(/timestamps:[^,}]*/, `timestamps: ${updates.timestamps}`);
        } else {
            updatedContent = updatedContent.replace(/fields:\s*\[/, `timestamps: ${updates.timestamps},\n  fields: [`);
        }
    }
    if (updates.versioning !== undefined) {
        if (updatedContent.includes('versioning:')) {
            updatedContent = updatedContent.replace(/versioning:[^,}]*/, `versioning: ${updates.versioning}`);
        } else {
            updatedContent = updatedContent.replace(/fields:\s*\[/, `versioning: ${updates.versioning},\n  fields: [`);
        }
    }
    return updatedContent;
}

//# sourceMappingURL=config.js.map