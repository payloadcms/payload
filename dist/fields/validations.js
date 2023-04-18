"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.point = exports.blocks = exports.radio = exports.select = exports.array = exports.relationship = exports.upload = exports.date = exports.checkbox = exports.richText = exports.json = exports.code = exports.textarea = exports.email = exports.password = exports.text = exports.number = void 0;
const defaultValue_1 = __importDefault(require("./richText/defaultValue"));
const types_1 = require("./config/types");
const canUseDOM_1 = __importDefault(require("../utilities/canUseDOM"));
const isValidID_1 = require("../utilities/isValidID");
const getIDType_1 = require("../utilities/getIDType");
const number = (value, { t, required, min, max }) => {
    const parsedValue = parseFloat(value);
    if ((value && typeof parsedValue !== 'number') || (required && Number.isNaN(parsedValue)) || (value && Number.isNaN(parsedValue))) {
        return t('validation:enterNumber');
    }
    if (typeof max === 'number' && parsedValue > max) {
        return t('validation:greaterThanMax', { value, max });
    }
    if (typeof min === 'number' && parsedValue < min) {
        return t('validation:lessThanMin', { value, min });
    }
    if (required && typeof parsedValue !== 'number') {
        return t('validation:required');
    }
    return true;
};
exports.number = number;
const text = (value, { t, minLength, maxLength: fieldMaxLength, required, payload }) => {
    var _a;
    let maxLength;
    if (typeof ((_a = payload === null || payload === void 0 ? void 0 : payload.config) === null || _a === void 0 ? void 0 : _a.defaultMaxTextLength) === 'number')
        maxLength = payload.config.defaultMaxTextLength;
    if (typeof fieldMaxLength === 'number')
        maxLength = fieldMaxLength;
    if (value && maxLength && value.length > maxLength) {
        return t('validation:shorterThanMax', { maxLength });
    }
    if (value && minLength && (value === null || value === void 0 ? void 0 : value.length) < minLength) {
        return t('validation:longerThanMin', { minLength });
    }
    if (required) {
        if (typeof value !== 'string' || (value === null || value === void 0 ? void 0 : value.length) === 0) {
            return t('validation:required');
        }
    }
    return true;
};
exports.text = text;
const password = (value, { t, required, maxLength: fieldMaxLength, minLength, payload }) => {
    var _a;
    let maxLength;
    if (typeof ((_a = payload === null || payload === void 0 ? void 0 : payload.config) === null || _a === void 0 ? void 0 : _a.defaultMaxTextLength) === 'number')
        maxLength = payload.config.defaultMaxTextLength;
    if (typeof fieldMaxLength === 'number')
        maxLength = fieldMaxLength;
    if (value && maxLength && value.length > maxLength) {
        return t('validation:shorterThanMax', { maxLength });
    }
    if (value && minLength && value.length < minLength) {
        return t('validation:longerThanMin', { minLength });
    }
    if (required && !value) {
        return t('validation:required');
    }
    return true;
};
exports.password = password;
const email = (value, { t, required }) => {
    if ((value && !/\S+@\S+\.\S+/.test(value))
        || (!value && required)) {
        return t('validation:emailAddress');
    }
    return true;
};
exports.email = email;
const textarea = (value, { t, required, maxLength: fieldMaxLength, minLength, payload, }) => {
    var _a;
    let maxLength;
    if (typeof ((_a = payload === null || payload === void 0 ? void 0 : payload.config) === null || _a === void 0 ? void 0 : _a.defaultMaxTextLength) === 'number')
        maxLength = payload.config.defaultMaxTextLength;
    if (typeof fieldMaxLength === 'number')
        maxLength = fieldMaxLength;
    if (value && maxLength && value.length > maxLength) {
        return t('validation:shorterThanMax', { maxLength });
    }
    if (value && minLength && value.length < minLength) {
        return t('validation:longerThanMin', { minLength });
    }
    if (required && !value) {
        return t('validation:required');
    }
    return true;
};
exports.textarea = textarea;
const code = (value, { t, required }) => {
    if (required && value === undefined) {
        return t('validation:required');
    }
    return true;
};
exports.code = code;
const json = (value, { t, required, jsonError, }) => {
    if (required && !value) {
        return t('validation:required');
    }
    if (jsonError !== undefined) {
        return t('validation:invalidInput');
    }
    return true;
};
exports.json = json;
const richText = (value, { t, required }) => {
    if (required) {
        const stringifiedDefaultValue = JSON.stringify(defaultValue_1.default);
        if (value && JSON.stringify(value) !== stringifiedDefaultValue)
            return true;
        return t('validation:required');
    }
    return true;
};
exports.richText = richText;
const checkbox = (value, { t, required }) => {
    if ((value && typeof value !== 'boolean')
        || (required && typeof value !== 'boolean')) {
        return t('validation:trueOrFalse');
    }
    return true;
};
exports.checkbox = checkbox;
const date = (value, { t, required }) => {
    if (value && !isNaN(Date.parse(value.toString()))) { /* eslint-disable-line */
        return true;
    }
    if (value) {
        return t('validation:notValidDate', { value });
    }
    if (required) {
        return t('validation:required');
    }
    return true;
};
exports.date = date;
const validateFilterOptions = async (value, { t, filterOptions, id, user, data, siblingData, relationTo, payload }) => {
    if (!canUseDOM_1.default && typeof filterOptions !== 'undefined' && value) {
        const options = {};
        const collections = typeof relationTo === 'string' ? [relationTo] : relationTo;
        const values = Array.isArray(value) ? value : [value];
        await Promise.all(collections.map(async (collection) => {
            const optionFilter = typeof filterOptions === 'function' ? filterOptions({
                id,
                data,
                siblingData,
                user,
                relationTo: collection,
            }) : filterOptions;
            const valueIDs = [];
            values.forEach((val) => {
                if (typeof val === 'object' && (val === null || val === void 0 ? void 0 : val.value)) {
                    valueIDs.push(val.value);
                }
                if (typeof val === 'string' || typeof val === 'number') {
                    valueIDs.push(val);
                }
            });
            const result = await payload.find({
                collection,
                depth: 0,
                where: {
                    and: [
                        { id: { in: valueIDs } },
                        optionFilter,
                    ],
                },
            });
            options[collection] = result.docs.map((doc) => doc.id);
        }));
        const invalidRelationships = values.filter((val) => {
            let collection;
            let requestedID;
            if (typeof relationTo === 'string') {
                collection = relationTo;
                if (typeof val === 'string' || typeof val === 'number') {
                    requestedID = val;
                }
            }
            if (Array.isArray(relationTo) && typeof val === 'object' && (val === null || val === void 0 ? void 0 : val.relationTo)) {
                collection = val.relationTo;
                requestedID = val.value;
            }
            return options[collection].indexOf(requestedID) === -1;
        });
        if (invalidRelationships.length > 0) {
            return invalidRelationships.reduce((err, invalid, i) => {
                return `${err} ${JSON.stringify(invalid)}${invalidRelationships.length === i + 1 ? ',' : ''} `;
            }, t('validation:invalidSelections'));
        }
        return true;
    }
    return true;
};
const upload = (value, options) => {
    if (!value && options.required) {
        return options.t('validation:required');
    }
    if (!canUseDOM_1.default && typeof value !== 'undefined' && value !== null) {
        const idField = options.payload.collections[options.relationTo].config.fields.find((field) => (0, types_1.fieldAffectsData)(field) && field.name === 'id');
        const type = (0, getIDType_1.getIDType)(idField);
        if (!(0, isValidID_1.isValidID)(value, type)) {
            return options.t('validation:validUploadID');
        }
    }
    return validateFilterOptions(value, options);
};
exports.upload = upload;
const relationship = async (value, options) => {
    const { required, min, max, relationTo, payload, t, } = options;
    if ((!value || (Array.isArray(value) && value.length === 0)) && required) {
        return options.t('validation:required');
    }
    if (Array.isArray(value)) {
        if (min && value.length < min) {
            return t('validation:lessThanMin', { count: min, label: t('rows') });
        }
        if (max && value.length > max) {
            return t('validation:greaterThanMax', { count: max, label: t('rows') });
        }
    }
    if (!canUseDOM_1.default && typeof value !== 'undefined' && value !== null) {
        const values = Array.isArray(value) ? value : [value];
        const invalidRelationships = values.filter((val) => {
            let collection;
            let requestedID;
            if (typeof relationTo === 'string') {
                collection = relationTo;
                // custom id
                if (typeof val === 'string' || typeof val === 'number') {
                    requestedID = val;
                }
            }
            if (Array.isArray(relationTo) && typeof val === 'object' && (val === null || val === void 0 ? void 0 : val.relationTo)) {
                collection = val.relationTo;
                requestedID = val.value;
            }
            const idField = payload.collections[collection].config.fields.find((field) => (0, types_1.fieldAffectsData)(field) && field.name === 'id');
            let type;
            if (idField) {
                type = idField.type === 'number' ? 'number' : 'text';
            }
            else {
                type = 'ObjectID';
            }
            return !(0, isValidID_1.isValidID)(requestedID, type);
        });
        if (invalidRelationships.length > 0) {
            return `This field has the following invalid selections: ${invalidRelationships.map((err, invalid) => {
                return `${err} ${JSON.stringify(invalid)}`;
            }).join(', ')}`;
        }
    }
    return validateFilterOptions(value, options);
};
exports.relationship = relationship;
const array = (value, { t, minRows, maxRows, required }) => {
    if (minRows && value < minRows) {
        return t('validation:requiresAtLeast', { count: minRows, label: t('rows') });
    }
    if (maxRows && value > maxRows) {
        return t('validation:requiresNoMoreThan', { count: maxRows, label: t('rows') });
    }
    if (!value && required) {
        return t('validation:requiresAtLeast', { count: 1, label: t('row') });
    }
    return true;
};
exports.array = array;
const select = (value, { t, options, hasMany, required }) => {
    if (Array.isArray(value) && value.some((input) => !options.some((option) => (option === input || (typeof option !== 'string' && (option === null || option === void 0 ? void 0 : option.value) === input))))) {
        return t('validation:invalidSelection');
    }
    if (typeof value === 'string' && !options.some((option) => (option === value || (typeof option !== 'string' && option.value === value)))) {
        return t('validation:invalidSelection');
    }
    if (required && ((typeof value === 'undefined' || value === null) || (hasMany && Array.isArray(value) && (value === null || value === void 0 ? void 0 : value.length) === 0))) {
        return t('validation:required');
    }
    return true;
};
exports.select = select;
const radio = (value, { t, options, required }) => {
    if (value) {
        const valueMatchesOption = options.some((option) => (option === value || (typeof option !== 'string' && option.value === value)));
        return valueMatchesOption || t('validation:invalidSelection');
    }
    return required ? t('validation:required') : true;
};
exports.radio = radio;
const blocks = (value, { t, maxRows, minRows, required }) => {
    if (minRows && value < minRows) {
        return t('validation:requiresAtLeast', { count: minRows, label: t('rows') });
    }
    if (maxRows && value > maxRows) {
        return t('validation:requiresNoMoreThan', { count: maxRows, label: t('rows') });
    }
    if (!value && required) {
        return t('validation:requiresAtLeast', { count: 1, label: t('row') });
    }
    return true;
};
exports.blocks = blocks;
const point = (value = ['', ''], { t, required }) => {
    const lng = parseFloat(String(value[0]));
    const lat = parseFloat(String(value[1]));
    if (required && ((value[0] && value[1] && typeof lng !== 'number' && typeof lat !== 'number')
        || (Number.isNaN(lng) || Number.isNaN(lat))
        || (Array.isArray(value) && value.length !== 2))) {
        return t('validation:requiresTwoNumbers');
    }
    if ((value[1] && Number.isNaN(lng)) || (value[0] && Number.isNaN(lat))) {
        return t('validation:invalidInput');
    }
    return true;
};
exports.point = point;
exports.default = {
    number: exports.number,
    text: exports.text,
    password: exports.password,
    email: exports.email,
    textarea: exports.textarea,
    code: exports.code,
    richText: exports.richText,
    checkbox: exports.checkbox,
    date: exports.date,
    upload: exports.upload,
    relationship: exports.relationship,
    array: exports.array,
    select: exports.select,
    radio: exports.radio,
    blocks: exports.blocks,
    point: exports.point,
    json: exports.json,
};
//# sourceMappingURL=validations.js.map