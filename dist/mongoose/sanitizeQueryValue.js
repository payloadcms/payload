"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeQueryValue = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const createArrayFromCommaDelineated_1 = require("./createArrayFromCommaDelineated");
const wordBoundariesRegex_1 = __importDefault(require("../utilities/wordBoundariesRegex"));
const sanitizeQueryValue = ({ ctx, field, path, operator, val, hasCustomID }) => {
    let formattedValue = val;
    // Disregard invalid _ids
    if (path === '_id' && typeof val === 'string' && val.split(',').length === 1) {
        if (!hasCustomID) {
            const isValid = mongoose_1.default.Types.ObjectId.isValid(val);
            formattedValue = new mongoose_1.default.Types.ObjectId(val);
            if (!isValid) {
                ctx.errors.push({ path });
                return undefined;
            }
        }
        if (field.type === 'number') {
            const parsedNumber = parseFloat(val);
            if (Number.isNaN(parsedNumber)) {
                ctx.errors.push({ path });
                return undefined;
            }
        }
    }
    // Cast incoming values as proper searchable types
    if (field.type === 'checkbox' && typeof val === 'string') {
        if (val.toLowerCase() === 'true')
            formattedValue = true;
        if (val.toLowerCase() === 'false')
            formattedValue = false;
    }
    if (field.type === 'number' && typeof val === 'string') {
        formattedValue = Number(val);
    }
    if (['relationship', 'upload'].includes(field.type)) {
        if (val === 'null') {
            formattedValue = null;
        }
        if (operator === 'in' && Array.isArray(formattedValue)) {
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
//# sourceMappingURL=sanitizeQueryValue.js.map