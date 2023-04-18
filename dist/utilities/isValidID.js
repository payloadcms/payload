"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidID = void 0;
const bson_objectid_1 = __importDefault(require("bson-objectid"));
const isValidID = (value, type) => {
    if (type === 'ObjectID') {
        return bson_objectid_1.default.isValid(String(value));
    }
    return (type === 'text' && typeof value === 'string')
        || (type === 'number' && typeof value === 'number' && !Number.isNaN(value));
};
exports.isValidID = isValidID;
//# sourceMappingURL=isValidID.js.map