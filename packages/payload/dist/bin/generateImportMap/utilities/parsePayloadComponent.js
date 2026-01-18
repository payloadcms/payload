export function parsePayloadComponent(PayloadComponent) {
    if (!PayloadComponent) {
        return null;
    }
    const pathAndMaybeExport = typeof PayloadComponent === 'string' ? PayloadComponent : PayloadComponent.path;
    let path;
    let exportName;
    if (pathAndMaybeExport.includes('#')) {
        ;
        [path, exportName] = pathAndMaybeExport.split('#', 2);
    } else {
        path = pathAndMaybeExport;
        exportName = 'default';
    }
    if (typeof PayloadComponent === 'object' && PayloadComponent.exportName) {
        exportName = PayloadComponent.exportName;
    }
    return {
        exportName,
        path
    };
}

//# sourceMappingURL=parsePayloadComponent.js.map