"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const flatley_1 = require("flatley");
const reduceFieldsToValues_1 = __importDefault(require("./reduceFieldsToValues"));
const getSiblingData = (fields, path) => {
    if (path.indexOf('.') === -1) {
        return (0, reduceFieldsToValues_1.default)(fields, true);
    }
    const siblingFields = {};
    // Determine if the last segment of the path is an array-based row
    const pathSegments = path.split('.');
    const lastSegment = pathSegments[pathSegments.length - 1];
    const lastSegmentIsRowIndex = !Number.isNaN(Number(lastSegment));
    let parentFieldPath;
    if (lastSegmentIsRowIndex) {
        // If the last segment is a row index,
        // the sibling data is that row's contents
        // so create a parent field path that will
        // retrieve all contents of that row index only
        parentFieldPath = `${path}.`;
    }
    else {
        // Otherwise, the last path segment is a field name
        // and it should be removed
        parentFieldPath = path.substring(0, path.lastIndexOf('.') + 1);
    }
    Object.keys(fields).forEach((fieldKey) => {
        if (!fields[fieldKey].disableFormData && fieldKey.indexOf(parentFieldPath) === 0) {
            siblingFields[fieldKey.replace(parentFieldPath, '')] = fields[fieldKey].value;
        }
    });
    return (0, flatley_1.unflatten)(siblingFields, { safe: true });
};
exports.default = getSiblingData;
//# sourceMappingURL=getSiblingData.js.map