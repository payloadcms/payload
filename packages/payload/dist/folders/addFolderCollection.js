import { sanitizeCollection } from '../collections/config/sanitize.js';
import { createFolderCollection } from './createFolderCollection.js';
export async function addFolderCollection({ collectionSpecific, config, folderEnabledCollections, richTextSanitizationPromises = [], validRelationships = [] }) {
    if (config.folders === false) {
        return;
    }
    let folderCollectionConfig = createFolderCollection({
        slug: config.folders.slug,
        collectionSpecific,
        debug: config.folders.debug,
        folderEnabledCollections,
        folderFieldName: config.folders.fieldName
    });
    const collectionIndex = config.collections.push(folderCollectionConfig);
    if (Array.isArray(config.folders?.collectionOverrides) && config?.folders.collectionOverrides.length) {
        for (const override of config.folders.collectionOverrides){
            folderCollectionConfig = await override({
                collection: folderCollectionConfig
            });
        }
    }
    const sanitizedCollectionWithOverrides = await sanitizeCollection(config, folderCollectionConfig, richTextSanitizationPromises, validRelationships);
    config.collections[collectionIndex - 1] = sanitizedCollectionWithOverrides;
}

//# sourceMappingURL=addFolderCollection.js.map