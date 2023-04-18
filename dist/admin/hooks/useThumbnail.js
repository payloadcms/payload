"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Config_1 = require("../components/utilities/Config");
const isImage_1 = __importDefault(require("../../uploads/isImage"));
const absoluteURLPattern = new RegExp('^(?:[a-z]+:)?//', 'i');
const base64Pattern = new RegExp(/^data:image\/[a-z]+;base64,/);
const useThumbnail = (collection, doc) => {
    var _a, _b;
    const { upload: { staticURL, adminThumbnail, }, } = collection;
    const { mimeType, sizes, filename, url, } = doc;
    const { serverURL } = (0, Config_1.useConfig)();
    if ((0, isImage_1.default)(mimeType)) {
        if (typeof adminThumbnail === 'undefined' && url) {
            return url;
        }
        if (typeof adminThumbnail === 'function') {
            const thumbnailURL = adminThumbnail({ doc });
            if (absoluteURLPattern.test(thumbnailURL) || base64Pattern.test(thumbnailURL)) {
                return thumbnailURL;
            }
            return `${serverURL}${thumbnailURL}`;
        }
        if ((_a = sizes === null || sizes === void 0 ? void 0 : sizes[adminThumbnail]) === null || _a === void 0 ? void 0 : _a.url) {
            return sizes[adminThumbnail].url;
        }
        if ((_b = sizes === null || sizes === void 0 ? void 0 : sizes[adminThumbnail]) === null || _b === void 0 ? void 0 : _b.filename) {
            return `${serverURL}${staticURL}/${sizes[adminThumbnail].filename}`;
        }
        return `${serverURL}${staticURL}/${filename}`;
    }
    return false;
};
exports.default = useThumbnail;
//# sourceMappingURL=useThumbnail.js.map