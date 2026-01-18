import { hasAutosaveEnabled, hasDraftsEnabled } from '../utilities/getVersionsConfig.js';
import { versionSnapshotField } from './baseFields.js';
export const buildVersionGlobalFields = (config, global, flatten)=>{
    const fields = [
        {
            name: 'version',
            type: 'group',
            fields: global.fields,
            ...flatten && {
                flattenedFields: global.flattenedFields
            }
        },
        {
            name: 'createdAt',
            type: 'date',
            admin: {
                disabled: true
            },
            index: true
        },
        {
            name: 'updatedAt',
            type: 'date',
            admin: {
                disabled: true
            },
            index: true
        }
    ];
    if (hasDraftsEnabled(global)) {
        if (config.localization) {
            fields.push(versionSnapshotField);
            fields.push({
                name: 'publishedLocale',
                type: 'select',
                admin: {
                    disableBulkEdit: true,
                    disabled: true
                },
                index: true,
                options: config.localization.locales.map((locale)=>{
                    if (typeof locale === 'string') {
                        return locale;
                    }
                    return locale.code;
                })
            });
        }
        fields.push({
            name: 'latest',
            type: 'checkbox',
            admin: {
                disabled: true
            },
            index: true
        });
        if (hasAutosaveEnabled(global)) {
            fields.push({
                name: 'autosave',
                type: 'checkbox',
                index: true
            });
        }
    }
    return fields;
};

//# sourceMappingURL=buildGlobalFields.js.map