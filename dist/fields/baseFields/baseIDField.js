"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseIDField = void 0;
const bson_objectid_1 = __importDefault(require("bson-objectid"));
const generateID = ({ value }) => (value || new bson_objectid_1.default().toHexString());
exports.baseIDField = {
    name: 'id',
    label: 'ID',
    type: 'text',
    hooks: {
        beforeChange: [
            generateID,
        ],
    },
    admin: {
        disabled: true,
    },
};
//# sourceMappingURL=baseIDField.js.map