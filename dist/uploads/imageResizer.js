"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const file_type_1 = require("file-type");
const fs_1 = __importDefault(require("fs"));
const sanitize_filename_1 = __importDefault(require("sanitize-filename"));
const sharp_1 = __importDefault(require("sharp"));
const fileExists_1 = __importDefault(require("./fileExists"));
function getOutputImage(sourceImage, size) {
    const extension = sourceImage.split('.').pop();
    const name = (0, sanitize_filename_1.default)(sourceImage.substring(0, sourceImage.lastIndexOf('.')) || sourceImage);
    return {
        name,
        extension,
        width: size.width,
        height: size.height,
    };
}
async function resizeAndSave({ req, file, dimensions, staticPath, config, savedFilename, }) {
    const { imageSizes } = config.upload;
    const sizesToSave = [];
    const sizeData = {};
    const sharpInstance = (0, sharp_1.default)(file.tempFilePath || file.data);
    const promises = imageSizes
        .map(async (desiredSize) => {
        if (!needsResize(desiredSize, dimensions)) {
            sizeData[desiredSize.name] = {
                url: null,
                width: null,
                height: null,
                filename: null,
                filesize: null,
                mimeType: null,
            };
            return;
        }
        let resized = sharpInstance.resize(desiredSize);
        if (desiredSize.formatOptions) {
            resized = resized.toFormat(desiredSize.formatOptions.format, desiredSize.formatOptions.options);
        }
        const bufferObject = await resized.toBuffer({
            resolveWithObject: true,
        });
        req.payloadUploadSizes[desiredSize.name] = bufferObject.data;
        const mimeType = (await (0, file_type_1.fromBuffer)(bufferObject.data));
        const outputImage = getOutputImage(savedFilename, desiredSize);
        const imageNameWithDimensions = createImageName(outputImage, bufferObject, mimeType.ext);
        const imagePath = `${staticPath}/${imageNameWithDimensions}`;
        const fileAlreadyExists = await (0, fileExists_1.default)(imagePath);
        if (fileAlreadyExists) {
            fs_1.default.unlinkSync(imagePath);
        }
        sizesToSave.push({
            path: imagePath,
            buffer: bufferObject.data,
        });
        sizeData[desiredSize.name] = {
            width: bufferObject.info.width,
            height: bufferObject.info.height,
            filename: imageNameWithDimensions,
            filesize: bufferObject.info.size,
            mimeType: mimeType.mime,
        };
    });
    await Promise.all(promises);
    return {
        sizeData,
        sizesToSave,
    };
}
exports.default = resizeAndSave;
function createImageName(outputImage, bufferObject, extension) {
    return `${outputImage.name}-${bufferObject.info.width}x${bufferObject.info.height}.${extension}`;
}
function needsResize(desiredSize, dimensions) {
    return (typeof desiredSize.width === 'number' && desiredSize.width <= dimensions.width)
        || (typeof desiredSize.height === 'number' && desiredSize.height <= dimensions.height);
}
//# sourceMappingURL=imageResizer.js.map