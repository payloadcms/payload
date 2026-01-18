/**
 * Mutates the incoming select object to append fields required for upload thumbnails
 * @param collectionConfig
 * @param select
 */ export const appendUploadSelectFields = ({ collectionConfig, select })=>{
    if (!collectionConfig.upload || !select) {
        return;
    }
    select.mimeType = true;
    select.thumbnailURL = true;
    if (collectionConfig.upload.imageSizes && collectionConfig.upload.imageSizes.length > 0) {
        if (collectionConfig.upload.adminThumbnail && typeof collectionConfig.upload.adminThumbnail === 'string') {
            /** Only return image size properties that are required to generate the adminThumbnailURL */ select.sizes = {
                [collectionConfig.upload.adminThumbnail]: {
                    filename: true
                }
            };
        } else {
            /** Only return image size properties that are required for thumbnails */ select.sizes = collectionConfig.upload.imageSizes.reduce((acc, imageSizeConfig)=>{
                return {
                    ...acc,
                    [imageSizeConfig.name]: {
                        filename: true,
                        url: true,
                        width: true
                    }
                };
            }, {});
        }
    } else {
        select.url = true;
    }
};

//# sourceMappingURL=appendUploadSelectFields.js.map