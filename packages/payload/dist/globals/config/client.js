import { createClientFields } from '../../fields/config/client.js';
const serverOnlyProperties = [
    'hooks',
    'access',
    'endpoints',
    'custom',
    'flattenedFields'
];
const serverOnlyGlobalAdminProperties = [
    'hidden',
    'components'
];
export const createClientGlobalConfig = ({ defaultIDType, global, i18n, importMap })=>{
    const clientGlobal = {};
    for(const key in global){
        if (serverOnlyProperties.includes(key)) {
            continue;
        }
        switch(key){
            case 'admin':
                if (!global.admin) {
                    break;
                }
                clientGlobal.admin = {};
                for(const adminKey in global.admin){
                    if (serverOnlyGlobalAdminProperties.includes(adminKey)) {
                        continue;
                    }
                    switch(adminKey){
                        case 'livePreview':
                            if (!global.admin.livePreview) {
                                break;
                            }
                            clientGlobal.admin.livePreview = {};
                            if (global.admin.livePreview.breakpoints) {
                                clientGlobal.admin.livePreview.breakpoints = global.admin.livePreview.breakpoints;
                            }
                            break;
                        case 'preview':
                            clientGlobal.admin.preview = true;
                            break;
                        default:
                            ;
                            clientGlobal.admin[adminKey] = global.admin[adminKey];
                    }
                }
                break;
            case 'fields':
                clientGlobal.fields = createClientFields({
                    defaultIDType,
                    fields: global.fields,
                    i18n,
                    importMap
                });
                break;
            case 'label':
                clientGlobal.label = typeof global.label === 'function' ? global.label({
                    i18n,
                    t: i18n.t
                }) : global.label;
                break;
            default:
                {
                    ;
                    clientGlobal[key] = global[key];
                    break;
                }
        }
    }
    return clientGlobal;
};
export const createClientGlobalConfigs = ({ defaultIDType, globals, i18n, importMap })=>{
    const clientGlobals = new Array(globals.length);
    for(let i = 0; i < globals.length; i++){
        const global = globals[i];
        clientGlobals[i] = createClientGlobalConfig({
            defaultIDType,
            global: global,
            i18n,
            importMap
        });
    }
    return clientGlobals;
};

//# sourceMappingURL=client.js.map