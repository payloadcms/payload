'use client';
import { useDocumentInfo, useField } from '@payloadcms/ui';
import { useEffect } from 'react';
import { useImportExport } from '../ImportExportProvider/index.js';
export const CollectionField = ()=>{
    const { id, collectionSlug } = useDocumentInfo();
    const { setValue } = useField({
        path: 'collectionSlug'
    });
    const { collection } = useImportExport();
    useEffect(()=>{
        if (id) {
            return;
        }
        if (collection) {
            setValue(collection);
        } else if (collectionSlug) {
            setValue(collectionSlug);
        }
    }, [
        id,
        collection,
        setValue,
        collectionSlug
    ]);
    return null;
};

//# sourceMappingURL=index.js.map