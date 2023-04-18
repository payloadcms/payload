"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mimeTypeValidator_1 = require("./mimeTypeValidator");
const extractTranslations_1 = require("../translations/extractTranslations");
const labels = (0, extractTranslations_1.extractTranslations)(['upload:width', 'upload:height', 'upload:fileSize', 'upload:fileName', 'upload:sizes']);
const getBaseUploadFields = ({ config, collection }) => {
    const uploadOptions = typeof collection.upload === 'object' ? collection.upload : {};
    const mimeType = {
        name: 'mimeType',
        label: 'MIME Type',
        type: 'text',
        admin: {
            readOnly: true,
            hidden: true,
        },
    };
    const url = {
        name: 'url',
        label: 'URL',
        type: 'text',
        admin: {
            readOnly: true,
            hidden: true,
        },
    };
    const width = {
        name: 'width',
        label: labels['upload:width'],
        type: 'number',
        admin: {
            readOnly: true,
            hidden: true,
        },
    };
    const height = {
        name: 'height',
        label: labels['upload:height'],
        type: 'number',
        admin: {
            readOnly: true,
            hidden: true,
        },
    };
    const filesize = {
        name: 'filesize',
        label: labels['upload:fileSize'],
        type: 'number',
        admin: {
            readOnly: true,
            hidden: true,
        },
    };
    const filename = {
        name: 'filename',
        label: labels['upload:fileName'],
        type: 'text',
        index: true,
        unique: true,
        admin: {
            readOnly: true,
            hidden: true,
            disableBulkEdit: true,
        },
    };
    let uploadFields = [
        {
            ...url,
            hooks: {
                afterRead: [
                    ({ data }) => {
                        if (data === null || data === void 0 ? void 0 : data.filename) {
                            return `${config.serverURL}${uploadOptions.staticURL}/${data.filename}`;
                        }
                        return undefined;
                    },
                ],
            },
        },
        filename,
        mimeType,
        filesize,
        width,
        height,
    ];
    if (uploadOptions.mimeTypes) {
        mimeType.validate = (0, mimeTypeValidator_1.mimeTypeValidator)(uploadOptions.mimeTypes);
    }
    if (uploadOptions.imageSizes) {
        uploadFields = uploadFields.concat([
            {
                name: 'sizes',
                label: labels['upload:Sizes'],
                type: 'group',
                admin: {
                    hidden: true,
                },
                fields: uploadOptions.imageSizes.map((size) => ({
                    label: size.name,
                    name: size.name,
                    type: 'group',
                    admin: {
                        hidden: true,
                    },
                    fields: [
                        {
                            ...url,
                            hooks: {
                                afterRead: [
                                    ({ data }) => {
                                        var _a, _b;
                                        const sizeFilename = (_b = (_a = data === null || data === void 0 ? void 0 : data.sizes) === null || _a === void 0 ? void 0 : _a[size.name]) === null || _b === void 0 ? void 0 : _b.filename;
                                        if (sizeFilename) {
                                            return `${config.serverURL}${uploadOptions.staticURL}/${sizeFilename}`;
                                        }
                                        return undefined;
                                    },
                                ],
                            },
                        },
                        width,
                        height,
                        mimeType,
                        filesize,
                        {
                            ...filename,
                            unique: false,
                        },
                    ],
                })),
            },
        ]);
    }
    return uploadFields;
};
exports.default = getBaseUploadFields;
//# sourceMappingURL=getBaseFields.js.map