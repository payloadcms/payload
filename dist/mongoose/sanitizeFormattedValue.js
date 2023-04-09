"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeQueryValue = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const createArrayFromCommaDelineated_1 = require("./createArrayFromCommaDelineated");
const getSchemaTypeOptions_1 = require("./getSchemaTypeOptions");
const wordBoundariesRegex_1 = __importDefault(require("../utilities/wordBoundariesRegex"));
const sanitizeQueryValue = (schemaType, path, operator, val) => {
    let formattedValue = val;
    const schemaOptions = (0, getSchemaTypeOptions_1.getSchemaTypeOptions)(schemaType);
    // Disregard invalid _ids
    if (path === '_id' && typeof val === 'string' && val.split(',').length === 1) {
        if ((schemaType === null || schemaType === void 0 ? void 0 : schemaType.instance) === 'ObjectID') {
            const isValid = mongoose_1.default.Types.ObjectId.isValid(val);
            if (!isValid) {
                return undefined;
            }
        }
        if ((schemaType === null || schemaType === void 0 ? void 0 : schemaType.instance) === 'Number') {
            const parsedNumber = parseFloat(val);
            if (Number.isNaN(parsedNumber)) {
                return undefined;
            }
        }
    }
    // Cast incoming values as proper searchable types
    if ((schemaType === null || schemaType === void 0 ? void 0 : schemaType.instance) === 'Boolean' && typeof val === 'string') {
        if (val.toLowerCase() === 'true')
            formattedValue = true;
        if (val.toLowerCase() === 'false')
            formattedValue = false;
    }
    if ((schemaType === null || schemaType === void 0 ? void 0 : schemaType.instance) === 'Number' && typeof val === 'string') {
        formattedValue = Number(val);
    }
    if (((schemaOptions === null || schemaOptions === void 0 ? void 0 : schemaOptions.ref) || (schemaOptions === null || schemaOptions === void 0 ? void 0 : schemaOptions.refPath)) && val === 'null') {
        formattedValue = null;
    }
    // Set up specific formatting necessary by operators
    if (operator === 'near') {
        let lng;
        let lat;
        let maxDistance;
        let minDistance;
        if (Array.isArray(formattedValue)) {
            [lng, lat, maxDistance, minDistance] = formattedValue;
        }
        if (typeof formattedValue === 'string') {
            [lng, lat, maxDistance, minDistance] = (0, createArrayFromCommaDelineated_1.createArrayFromCommaDelineated)(formattedValue);
        }
        if (!lng || !lat || (!maxDistance && !minDistance)) {
            formattedValue = undefined;
        }
        else {
            formattedValue = {
                $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            };
            if (maxDistance)
                formattedValue.$maxDistance = parseFloat(maxDistance);
            if (minDistance)
                formattedValue.$minDistance = parseFloat(minDistance);
        }
    }
    if (['all', 'not_in', 'in'].includes(operator) && typeof formattedValue === 'string') {
        formattedValue = (0, createArrayFromCommaDelineated_1.createArrayFromCommaDelineated)(formattedValue);
    }
    if (schemaOptions && (schemaOptions.ref || schemaOptions.refPath) && operator === 'in') {
        if (Array.isArray(formattedValue)) {
            formattedValue = formattedValue.reduce((formattedValues, inVal) => {
                const newValues = [inVal];
                if (mongoose_1.default.Types.ObjectId.isValid(inVal))
                    newValues.push(new mongoose_1.default.Types.ObjectId(inVal));
                const parsedNumber = parseFloat(inVal);
                if (!Number.isNaN(parsedNumber))
                    newValues.push(parsedNumber);
                return [
                    ...formattedValues,
                    ...newValues,
                ];
            }, []);
        }
    }
    if (path !== '_id') {
        if (operator === 'contains') {
            formattedValue = { $regex: formattedValue, $options: 'i' };
        }
        if (operator === 'like' && typeof formattedValue === 'string') {
            const $regex = (0, wordBoundariesRegex_1.default)(formattedValue);
            formattedValue = { $regex };
        }
    }
    if (operator === 'exists') {
        formattedValue = (formattedValue === 'true' || formattedValue === true);
    }
    return formattedValue;
};
exports.sanitizeQueryValue = sanitizeQueryValue;
//# sourceMappingURL=sanitizeFormattedValue.js.map