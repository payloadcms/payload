import { parsePayloadComponent } from './parsePayloadComponent.js';
export const getFromImportMap = (args)=>{
    const { importMap, PayloadComponent, schemaPath, silent } = args;
    const { exportName, path } = parsePayloadComponent(PayloadComponent);
    const key = path + '#' + exportName;
    const importMapEntry = importMap[key];
    if (!importMapEntry && !silent) {
        // eslint-disable-next-line no-console
        console.error(`getFromImportMap: PayloadComponent not found in importMap`, {
            key,
            PayloadComponent,
            schemaPath
        }, 'You may need to run the `payload generate:importmap` command to generate the importMap ahead of runtime.');
    }
    return importMapEntry;
};

//# sourceMappingURL=getFromImportMap.js.map