/* eslint-disable no-console */ import fs from 'fs/promises';
import process from 'node:process';
import { iterateConfig } from './iterateConfig.js';
import { addPayloadComponentToImportMap } from './utilities/addPayloadComponentToImportMap.js';
import { getImportMapToBaseDirPath } from './utilities/getImportMapToBaseDirPath.js';
import { resolveImportMapFilePath } from './utilities/resolveImportMapFilePath.js';
export async function generateImportMap(config, options) {
    const shouldLog = options?.log ?? true;
    if (shouldLog) {
        console.log('Generating import map');
    }
    const importMap = {};
    const imports = {};
    // Determine the root directory of the project - usually the directory where the src or app folder is located
    const rootDir = process.env.ROOT_DIR ?? process.cwd();
    const baseDir = config.admin.importMap.baseDir ?? process.cwd();
    const importMapFilePath = await resolveImportMapFilePath({
        adminRoute: config.routes.admin,
        importMapFile: config?.admin?.importMap?.importMapFile,
        rootDir
    });
    if (importMapFilePath instanceof Error) {
        if (options?.ignoreResolveError) {
            return;
        } else {
            throw importMapFilePath;
        }
    }
    const importMapToBaseDirPath = getImportMapToBaseDirPath({
        baseDir,
        importMapPath: importMapFilePath
    });
    const addToImportMap = (payloadComponent)=>{
        if (!payloadComponent) {
            return;
        }
        if (typeof payloadComponent !== 'object' && typeof payloadComponent !== 'string') {
            console.error(payloadComponent);
            throw new Error('addToImportMap > Payload component must be an object or a string');
        }
        if (Array.isArray(payloadComponent)) {
            for (const component of payloadComponent){
                addPayloadComponentToImportMap({
                    importMap,
                    importMapToBaseDirPath,
                    imports,
                    payloadComponent: component
                });
            }
        } else {
            addPayloadComponentToImportMap({
                importMap,
                importMapToBaseDirPath,
                imports,
                payloadComponent
            });
        }
    };
    iterateConfig({
        addToImportMap,
        baseDir: config.admin.importMap.baseDir,
        config,
        importMap,
        imports
    });
    await writeImportMap({
        componentMap: importMap,
        force: options?.force,
        importMap: imports,
        importMapFilePath,
        log: shouldLog
    });
}
export async function writeImportMap({ componentMap, force, importMap, importMapFilePath, log }) {
    const imports = [];
    for (const [identifier, { path, specifier }] of Object.entries(importMap)){
        imports.push(`import { ${specifier} as ${identifier} } from '${path}'`);
    }
    const mapKeys = [];
    for (const [userPath, identifier] of Object.entries(componentMap)){
        mapKeys.push(`  "${userPath}": ${identifier}`);
    }
    const importMapOutputFile = `${imports.join('\n')}

export const importMap = {
${mapKeys.join(',\n')}
}
`;
    if (!force) {
        // Read current import map and check in the IMPORTS if there are any new imports. If not, don't write the file.
        const currentImportMap = await fs.readFile(importMapFilePath, 'utf-8');
        if (currentImportMap?.trim() === importMapOutputFile?.trim()) {
            if (log) {
                console.log('No new imports found, skipping writing import map');
            }
            return;
        }
    }
    if (log) {
        console.log('Writing import map to', importMapFilePath);
    }
    await fs.writeFile(importMapFilePath, importMapOutputFile);
}

//# sourceMappingURL=index.js.map