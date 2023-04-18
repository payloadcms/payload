"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringifyRichText = void 0;
const slate_1 = require("slate");
const stringifyRichText = (content) => {
    if (Array.isArray(content)) {
        return content.reduce((output, node) => {
            var _a, _b;
            const isTextNode = slate_1.Text.isText(node);
            const { text, } = node;
            if (isTextNode) {
                // convert straight single quotations to curly
                // "\u201C" is starting double curly
                // "\u201D" is ending double curly
                const sanitizedText = text === null || text === void 0 ? void 0 : text.replace(/'/g, '\u2019'); // single quotes
                return `${output}${sanitizedText}`;
            }
            if (node) {
                let nodeHTML;
                switch (node.type) {
                    case 'h1':
                    case 'h2':
                    case 'h3':
                    case 'h4':
                    case 'h5':
                    case 'h6':
                    case 'li':
                    case 'p':
                    case undefined:
                        nodeHTML = `${(0, exports.stringifyRichText)(node.children)}\n`;
                        break;
                    case 'ul':
                    case 'ol':
                        nodeHTML = `${(0, exports.stringifyRichText)(node.children)}\n\n`;
                        break;
                    case 'link':
                        nodeHTML = `${(0, exports.stringifyRichText)(node.children)}`;
                        break;
                    case 'relationship':
                        nodeHTML = `Relationship to ${node.relationTo}: ${(_a = node === null || node === void 0 ? void 0 : node.value) === null || _a === void 0 ? void 0 : _a.id}\n\n`;
                        break;
                    case 'upload':
                        nodeHTML = `${node.relationTo} Upload: ${(_b = node === null || node === void 0 ? void 0 : node.value) === null || _b === void 0 ? void 0 : _b.id}\n\n`;
                        break;
                    default:
                        nodeHTML = `${node.type}: ${JSON.stringify(node)}\n\n`;
                        break;
                }
                return `${output}${nodeHTML}`;
            }
            return output;
        }, '');
    }
    return '';
};
exports.stringifyRichText = stringifyRichText;
//# sourceMappingURL=stringifyRichText.js.map