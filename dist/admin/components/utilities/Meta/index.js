"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_helmet_1 = __importDefault(require("react-helmet"));
const Config_1 = require("../Config");
const favicon_svg_1 = __importDefault(require("../../../assets/images/favicon.svg"));
const og_image_png_1 = __importDefault(require("../../../assets/images/og-image.png"));
const useMountEffect_1 = __importDefault(require("../../../hooks/useMountEffect"));
const Meta = ({ description, lang = 'en', meta = [], title, keywords = 'CMS, Admin, Dashboard', }) => {
    var _a, _b, _c, _d;
    const config = (0, Config_1.useConfig)();
    const titleSuffix = (_b = (_a = config.admin.meta) === null || _a === void 0 ? void 0 : _a.titleSuffix) !== null && _b !== void 0 ? _b : '- Payload';
    const favicon = (_c = config.admin.meta.favicon) !== null && _c !== void 0 ? _c : favicon_svg_1.default;
    const ogImage = (_d = config.admin.meta.ogImage) !== null && _d !== void 0 ? _d : og_image_png_1.default;
    (0, useMountEffect_1.default)(() => {
        const faviconElement = document.querySelector('link[data-placeholder-favicon]');
        if (faviconElement) {
            faviconElement.remove();
        }
    });
    return (react_1.default.createElement(react_helmet_1.default, { htmlAttributes: {
            lang,
        }, title: `${title} ${titleSuffix}`, meta: [
            {
                name: 'description',
                content: description,
            },
            {
                name: 'keywords',
                content: keywords,
            },
            {
                property: 'og:title',
                content: `${title} ${titleSuffix}`,
            },
            {
                property: 'og:image',
                content: ogImage,
            },
            {
                property: 'og:description',
                content: description,
            },
            {
                property: 'og:type',
                content: 'website',
            },
            {
                name: 'twitter:card',
                content: 'summary',
            },
            {
                name: 'twitter:title',
                content: title,
            },
            {
                name: 'twitter:description',
                content: description,
            },
        ].concat(meta), link: [
            {
                rel: 'icon',
                type: 'image/svg+xml',
                href: favicon,
            },
        ] }));
};
exports.default = Meta;
//# sourceMappingURL=index.js.map