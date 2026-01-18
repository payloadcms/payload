'use client';
import { useAuth, useConfig, useEntityVisibility } from '@payloadcms/ui';
import * as React from 'react';
const filterRichTextCollections = (collections, options)=>{
    return collections.filter(({ slug, admin: { enableRichTextRelationship }, upload })=>{
        if (!options.visibleEntities.collections.includes(slug)) {
            return false;
        }
        if (options?.uploads) {
            return enableRichTextRelationship && Boolean(upload) === true;
        }
        return upload ? false : enableRichTextRelationship;
    });
};
export const EnabledRelationshipsCondition = (props)=>{
    const { children, uploads = false, ...rest } = props;
    const { config: { collections } } = useConfig();
    const { user } = useAuth();
    const { visibleEntities } = useEntityVisibility();
    const [enabledCollectionSlugs] = React.useState(()=>filterRichTextCollections(collections, {
            uploads,
            user,
            visibleEntities
        }).map(({ slug })=>slug));
    if (!enabledCollectionSlugs.length) {
        return null;
    }
    return /*#__PURE__*/ React.cloneElement(children, {
        ...rest,
        enabledCollectionSlugs
    });
};

//# sourceMappingURL=EnabledRelationshipsCondition.js.map