"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFileData = void 0;
const file_type_1 = require("file-type");
const mkdirp_1 = __importDefault(require("mkdirp"));
const path_1 = __importDefault(require("path"));
const sanitize_filename_1 = __importDefault(require("sanitize-filename"));
const sharp_1 = __importDefault(require("sharp"));
const errors_1 = require("../errors");
const getImageSize_1 = __importDefault(require("./getImageSize"));
const getSafeFilename_1 = __importDefault(require("./getSafeFilename"));
const imageResizer_1 = __importDefault(require("./imageResizer"));
const canResizeImage_1 = __importDefault(require("./canResizeImage"));
const isImage_1 = __importDefault(require("./isImage"));
const generateFileData = async ({ config, collection: { config: collectionConfig, Model, }, req, data, throwOnMissingFile, overwriteExistingFiles, }) => {
    if (!collectionConfig.upload) {
        return {
            data,
            files: [],
        };
    }
    const { file } = req.files || {};
    if (!file) {
        if (throwOnMissingFile)
            throw new errors_1.MissingFile(req.t);
        return {
            data,
            files: [],
        };
    }
    const { staticDir, imageSizes, disableLocalStorage, resizeOptions, formatOptions } = collectionConfig.upload;
    let staticPath = staticDir;
    if (staticDir.indexOf('/') !== 0) {
        staticPath = path_1.default.resolve(config.paths.configDir, staticDir);
    }
    if (!disableLocalStorage) {
        mkdirp_1.default.sync(staticPath);
    }
    let newData = data;
    const filesToSave = [];
    const fileData = {};
    const fileIsAnimated = (file.mimetype === 'image/gif') || (file.mimetype === 'image/webp');
    try {
        const fileSupportsResize = (0, canResizeImage_1.default)(file.mimetype);
        let fsSafeName;
        let sharpFile;
        let dimensions;
        let fileBuffer;
        let ext;
        let mime;
        const sharpOptions = {};
        if (fileIsAnimated)
            sharpOptions.animated = true;
        if (fileSupportsResize && (resizeOptions || formatOptions)) {
            if (file.tempFilePath) {
                sharpFile = (0, sharp_1.default)(file.tempFilePath, sharpOptions);
            }
            else {
                sharpFile = (0, sharp_1.default)(file.data, sharpOptions);
            }
            if (resizeOptions) {
                sharpFile = sharpFile
                    .resize(resizeOptions);
            }
            if (formatOptions) {
                sharpFile = sharpFile.toFormat(formatOptions.format, formatOptions.options);
            }
        }
        if ((0, isImage_1.default)(file.mimetype)) {
            dimensions = await (0, getImageSize_1.default)(file);
            fileData.width = dimensions.width;
            fileData.height = dimensions.height;
        }
        if (sharpFile) {
            fileBuffer = await sharpFile.toBuffer({ resolveWithObject: true });
            ({ mime, ext } = await (0, file_type_1.fromBuffer)(fileBuffer.data));
            fileData.width = fileBuffer.info.width;
            fileData.height = fileBuffer.info.height;
            fileData.filesize = fileBuffer.data.length;
        }
        else {
            mime = file.mimetype;
            fileData.filesize = file.size;
            ext = file.name.split('.').pop();
        }
        // Adust SVG mime type. fromBuffer modifies it.
        if (mime === 'application/xml' && ext === 'svg')
            mime = 'image/svg+xml';
        fileData.mimeType = mime;
        const baseFilename = (0, sanitize_filename_1.default)(file.name.substring(0, file.name.lastIndexOf('.')) || file.name);
        fsSafeName = `${baseFilename}.${ext}`;
        if (!overwriteExistingFiles) {
            fsSafeName = await (0, getSafeFilename_1.default)(Model, staticPath, `${baseFilename}.${ext}`);
        }
        fileData.filename = fsSafeName;
        // Original file
        filesToSave.push({
            path: `${staticPath}/${fsSafeName}`,
            buffer: (fileBuffer === null || fileBuffer === void 0 ? void 0 : fileBuffer.data) || file.data,
        });
        if (Array.isArray(imageSizes) && fileSupportsResize) {
            req.payloadUploadSizes = {};
            const { sizeData, sizesToSave } = await (0, imageResizer_1.default)({
                req,
                file,
                dimensions,
                staticPath,
                config: collectionConfig,
                savedFilename: fsSafeName || file.name,
                mimeType: fileData.mimeType,
            });
            fileData.sizes = sizeData;
            filesToSave.push(...sizesToSave);
        }
    }
    catch (err) {
        console.error(err);
        throw new errors_1.FileUploadError(req.t);
    }
    newData = {
        ...newData,
        ...fileData,
    };
    return {
        data: newData,
        files: filesToSave,
    };
};
exports.generateFileData = generateFileData;
//# sourceMappingURL=generateFileData.js.map