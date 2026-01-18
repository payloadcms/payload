export const getFields = ({ collection, pluginConfig, syncConfig })=>{
    const stripeIDField = {
        name: 'stripeID',
        type: 'text',
        admin: {
            position: 'sidebar',
            readOnly: true
        },
        label: 'Stripe ID',
        saveToJWT: true
    };
    const skipSyncField = {
        name: 'skipSync',
        type: 'checkbox',
        admin: {
            position: 'sidebar',
            readOnly: true
        },
        label: 'Skip Sync'
    };
    const docUrlField = {
        name: 'docUrl',
        type: 'ui',
        admin: {
            components: {
                Field: '@payloadcms/plugin-stripe/client#LinkToDoc'
            },
            custom: {
                isTestKey: pluginConfig.isTestKey,
                nameOfIDField: 'stripeID',
                stripeResourceType: syncConfig.stripeResourceType
            },
            position: 'sidebar'
        }
    };
    const fields = [
        ...collection.fields,
        stripeIDField,
        skipSyncField,
        docUrlField
    ];
    return fields;
};

//# sourceMappingURL=getFields.js.map