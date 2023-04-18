"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalizedSortProperty = void 0;
const types_1 = require("../fields/config/types");
const flattenTopLevelFields_1 = __importDefault(require("../utilities/flattenTopLevelFields"));
const getLocalizedSortProperty = ({ segments: incomingSegments, config, fields: incomingFields, locale, result: incomingResult, }) => {
    // If localization is not enabled, accept exactly
    // what is sent in
    if (!config.localization) {
        return incomingSegments.join('.');
    }
    // Flatten incoming fields (row, etc)
    const fields = (0, flattenTopLevelFields_1.default)(incomingFields);
    const segments = [...incomingSegments];
    // Retrieve first segment, and remove from segments
    const firstSegment = segments.shift();
    // Attempt to find a matched field
    const matchedField = fields.find((field) => (0, types_1.fieldAffectsData)(field) && field.name === firstSegment);
    if (matchedField && !(0, types_1.fieldIsPresentationalOnly)(matchedField)) {
        let nextFields;
        const remainingSegments = [...segments];
        let localizedSegment = matchedField.name;
        if (matchedField.localized) {
            // Check to see if next segment is a locale
            if (segments.length > 0) {
                const nextSegmentIsLocale = config.localization.locales.includes(remainingSegments[0]);
                // If next segment is locale, remove it from remaining segments
                // and use it to localize the current segment
                if (nextSegmentIsLocale) {
                    const nextSegment = remainingSegments.shift();
                    localizedSegment = `${matchedField.name}.${nextSegment}`;
                }
            }
            else {
                // If no more segments, but field is localized, use default locale
                localizedSegment = `${matchedField.name}.${locale}`;
            }
        }
        // If there are subfields, pass them through
        if (matchedField.type === 'tab' || matchedField.type === 'group' || matchedField.type === 'array') {
            nextFields = matchedField.fields;
        }
        if (matchedField.type === 'blocks') {
            nextFields = matchedField.blocks.reduce((flattenedBlockFields, block) => {
                return [
                    ...flattenedBlockFields,
                    ...block.fields.filter((blockField) => ((0, types_1.fieldAffectsData)(blockField) && (blockField.name !== 'blockType' && blockField.name !== 'blockName')) || !(0, types_1.fieldAffectsData)(blockField)),
                ];
            }, []);
        }
        const result = incomingResult ? `${incomingResult}.${localizedSegment}` : localizedSegment;
        if (nextFields) {
            return (0, exports.getLocalizedSortProperty)({
                segments: remainingSegments,
                config,
                fields: nextFields,
                locale,
                result,
            });
        }
        return result;
    }
    return incomingSegments.join('.');
};
exports.getLocalizedSortProperty = getLocalizedSortProperty;
//# sourceMappingURL=getLocalizedSortProperty.js.map