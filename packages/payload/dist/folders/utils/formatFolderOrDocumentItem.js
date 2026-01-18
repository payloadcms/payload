import { isImage } from '../../uploads/isImage.js';
import { getBestFitFromSizes } from '../../utilities/getBestFitFromSizes.js';
export function formatFolderOrDocumentItem({ folderFieldName, isUpload, relationTo, useAsTitle, value }) {
    const itemValue = {
        id: value?.id,
        _folderOrDocumentTitle: String(useAsTitle && value?.[useAsTitle] || value['id']),
        createdAt: value?.createdAt,
        folderID: value?.[folderFieldName],
        folderType: value?.folderType || [],
        updatedAt: value?.updatedAt
    };
    if (isUpload) {
        itemValue.filename = value.filename;
        itemValue.mimeType = value.mimeType;
        itemValue.url = value.thumbnailURL || (isImage(value.mimeType) ? getBestFitFromSizes({
            sizes: value.sizes,
            targetSizeMax: 520,
            targetSizeMin: 300,
            url: value.url,
            width: value.width
        }) : undefined);
    }
    return {
        itemKey: `${relationTo}-${value.id}`,
        relationTo,
        value: itemValue
    };
}

//# sourceMappingURL=formatFolderOrDocumentItem.js.map