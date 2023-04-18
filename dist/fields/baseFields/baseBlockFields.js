"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseBlockFields = void 0;
const baseIDField_1 = require("./baseIDField");
exports.baseBlockFields = [
    baseIDField_1.baseIDField,
    {
        name: 'blockName',
        label: 'Block Name',
        type: 'text',
        required: false,
        admin: {
            disabled: true,
        },
    },
];
//# sourceMappingURL=baseBlockFields.js.map