import { fileTypeFromBuffer } from 'file-type';
import fs from 'fs/promises';
import { fileExists } from '../fileExists.js';
import { optionallyAppendMetadata } from '../optionallyAppendMetadata.js';
import { createImageSize } from './createImageSize.js';
import { extractHeightFromImage } from './extractHeightFromImage.js';
import { generateImageSizeFilename } from './generateImageSizeFilename.js';
import { getImageResizeAction } from './getImageResizeAction.js';
import { parseFilename } from './parseFilename.js';
import { sanitizeResizeConfig } from './sanitizeResizeConfig.js';
export async function createImageSizes({ config, dimensions, file, focalPoint, mimeType, req, savedFilename, sharp, staticPath, withMetadata }) {
    const { imageSizes } = config.upload;
    if (!imageSizes || !sharp) {
        return {
            sizeData: {},
            sizesToSave: []
        };
    }
    // Determine if the file is animated
    const fileIsAnimatedType = [
        'image/avif',
        'image/gif',
        'image/webp'
    ].includes(file.mimetype);
    const sharpOptions = {};
    if (fileIsAnimatedType) {
        sharpOptions.animated = true;
    }
    const sharpBase = sharp(file.tempFilePath || file.data, sharpOptions).rotate() // pass rotate() to auto-rotate based on EXIF data. https://github.com/payloadcms/payload/pull/3081
    ;
    const originalImageMeta = await sharpBase.metadata();
    let adjustedDimensions = {
        ...dimensions
    };
    // Images with an exif orientation of 5, 6, 7, or 8 are auto-rotated by sharp
    // Need to adjust the dimensions to match the original image
    if ([
        5,
        6,
        7,
        8
    ].includes(originalImageMeta.orientation)) {
        adjustedDimensions = {
            ...dimensions,
            height: dimensions.width,
            width: dimensions.height
        };
    }
    const resizeImageMeta = {
        height: originalImageMeta.height,
        width: originalImageMeta.width
    };
    const sizes = {};
    const imageSizeFiles = [];
    await Promise.all(imageSizes.map(async (imageResizeConfig)=>{
        imageResizeConfig = sanitizeResizeConfig(imageResizeConfig);
        const resizeAction = getImageResizeAction({
            dimensions,
            hasFocalPoint: Boolean(focalPoint),
            imageResizeConfig
        });
        if (resizeAction === 'omit') {
            sizes[imageResizeConfig.name] = createImageSize({});
            return;
        }
        const imageToResize = sharpBase.clone();
        let resized = imageToResize;
        if (resizeAction === 'resizeWithFocalPoint') {
            let { height: resizeHeight, width: resizeWidth } = imageResizeConfig;
            const originalAspectRatio = adjustedDimensions.width / adjustedDimensions.height;
            // Calculate resizeWidth based on original aspect ratio if it's undefined
            if (resizeHeight && !resizeWidth) {
                resizeWidth = Math.round(resizeHeight * originalAspectRatio);
            }
            // Calculate resizeHeight based on original aspect ratio if it's undefined
            if (resizeWidth && !resizeHeight) {
                resizeHeight = Math.round(resizeWidth / originalAspectRatio);
            }
            if (!resizeHeight) {
                resizeHeight = resizeImageMeta.height;
            }
            if (!resizeWidth) {
                resizeWidth = resizeImageMeta.width;
            }
            const resizeAspectRatio = resizeWidth / resizeHeight;
            const prioritizeHeight = resizeAspectRatio < originalAspectRatio;
            // Scales the image before extracting from it
            resized = imageToResize.resize({
                fastShrinkOnLoad: false,
                height: prioritizeHeight ? resizeHeight : undefined,
                width: prioritizeHeight ? undefined : resizeWidth
            });
            const metadataAppendedFile = await optionallyAppendMetadata({
                req,
                sharpFile: resized,
                withMetadata: withMetadata
            });
            // Must read from buffer, resized.metadata will return the original image metadata
            const { info } = await metadataAppendedFile.toBuffer({
                resolveWithObject: true
            });
            resizeImageMeta.height = extractHeightFromImage({
                ...originalImageMeta,
                height: info.height
            });
            resizeImageMeta.width = info.width;
            const halfResizeX = resizeWidth / 2;
            const xFocalCenter = resizeImageMeta.width * (focalPoint.x / 100);
            const calculatedRightPixelBound = xFocalCenter + halfResizeX;
            let leftBound = xFocalCenter - halfResizeX;
            // if the right bound is greater than the image width, adjust the left bound
            // keeping focus on the right
            if (calculatedRightPixelBound > resizeImageMeta.width) {
                leftBound = resizeImageMeta.width - resizeWidth;
            }
            // if the left bound is less than 0, adjust the left bound to 0
            // keeping the focus on the left
            if (leftBound < 0) {
                leftBound = 0;
            }
            const halfResizeY = resizeHeight / 2;
            const yFocalCenter = resizeImageMeta.height * (focalPoint.y / 100);
            const calculatedBottomPixelBound = yFocalCenter + halfResizeY;
            let topBound = yFocalCenter - halfResizeY;
            // if the bottom bound is greater than the image height, adjust the top bound
            // keeping the image as far right as possible
            if (calculatedBottomPixelBound > resizeImageMeta.height) {
                topBound = resizeImageMeta.height - resizeHeight;
            }
            // if the top bound is less than 0, adjust the top bound to 0
            // keeping the image focus near the top
            if (topBound < 0) {
                topBound = 0;
            }
            resized = resized.extract({
                height: resizeHeight,
                left: Math.floor(leftBound),
                top: Math.floor(topBound),
                width: resizeWidth
            });
        } else {
            resized = imageToResize.resize(imageResizeConfig);
        }
        if (imageResizeConfig.formatOptions) {
            resized = resized.toFormat(imageResizeConfig.formatOptions.format, imageResizeConfig.formatOptions.options);
        }
        if (imageResizeConfig.trimOptions) {
            resized = resized.trim(imageResizeConfig.trimOptions);
        }
        const metadataAppendedFile = await optionallyAppendMetadata({
            req,
            sharpFile: resized,
            withMetadata: withMetadata
        });
        const { data: bufferData, info: bufferInfo } = await metadataAppendedFile.toBuffer({
            resolveWithObject: true
        });
        const { name, ext } = parseFilename(savedFilename);
        if (req.payloadUploadSizes) {
            req.payloadUploadSizes[imageResizeConfig.name] = bufferData;
        }
        const mimeInfo = await fileTypeFromBuffer(bufferData);
        const imageNameWithDimensions = imageResizeConfig.generateImageName ? imageResizeConfig.generateImageName({
            extension: mimeInfo?.ext || ext,
            height: extractHeightFromImage({
                ...originalImageMeta,
                height: bufferInfo.height
            }),
            originalName: name,
            sizeName: imageResizeConfig.name,
            width: bufferInfo.width
        }) : generateImageSizeFilename({
            extension: mimeInfo?.ext || ext,
            height: extractHeightFromImage({
                ...originalImageMeta,
                height: bufferInfo.height
            }),
            outputImageName: name,
            width: bufferInfo.width
        });
        const imagePath = `${staticPath}/${imageNameWithDimensions}`;
        if (await fileExists(imagePath)) {
            try {
                await fs.unlink(imagePath);
            } catch  {
            // Ignore unlink errors
            }
        }
        const { height, size, width } = bufferInfo;
        sizes[imageResizeConfig.name] = createImageSize({
            filename: imageNameWithDimensions,
            filesize: size,
            height: fileIsAnimatedType && originalImageMeta.pages ? height / originalImageMeta.pages : height,
            mimeType: mimeInfo?.mime || mimeType,
            width
        });
        imageSizeFiles.push({
            buffer: bufferData,
            path: imagePath
        });
    }));
    return {
        sizeData: sizes,
        sizesToSave: imageSizeFiles
    };
}

//# sourceMappingURL=createImageSizes.js.map