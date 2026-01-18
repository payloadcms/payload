import { jsx as _jsx } from "react/jsx-runtime";
import { ReindexButtonClient } from './index.client.js';
export const ReindexButton = (props)=>{
    const { collectionLabels, i18n, searchCollections, searchSlug } = props;
    const resolvedCollectionLabels = Object.fromEntries(searchCollections.map((collection)=>{
        const labels = collectionLabels[collection];
        const pluralLabel = labels?.plural;
        if (typeof pluralLabel === 'function') {
            // @ts-expect-error - I don't know why it gives an error. pluralLabel and i18n.t should both resolve to TFunction<DefaultTranslationKeys>
            return [
                collection,
                pluralLabel({
                    t: i18n.t
                })
            ];
        }
        if (pluralLabel) {
            return [
                collection,
                pluralLabel
            ];
        }
        return [
            collection,
            collection
        ];
    }));
    return /*#__PURE__*/ _jsx(ReindexButtonClient, {
        collectionLabels: resolvedCollectionLabels,
        searchCollections: searchCollections,
        searchSlug: searchSlug
    });
};

//# sourceMappingURL=index.js.map