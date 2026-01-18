'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { SelectField, useDocumentInfo } from '@payloadcms/ui';
export const ImportCollectionField = (props)=>{
    const { id, initialData } = useDocumentInfo();
    // If creating (no id) and have initialData with collectionSlug (e.g., from drawer),
    // hide the field to prevent user selection.
    if (!id && initialData?.collectionSlug) {
        return null;
    }
    // Otherwise render the normal select field
    return /*#__PURE__*/ _jsx(SelectField, {
        ...props
    });
};

//# sourceMappingURL=index.js.map