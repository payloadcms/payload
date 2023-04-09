"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validations_1 = require("../../fields/validations");
const extractTranslations_1 = require("../../translations/extractTranslations");
const labels = (0, extractTranslations_1.extractTranslations)(['general:email']);
exports.default = [
    {
        name: 'email',
        label: labels['general:email'],
        type: 'email',
        validate: validations_1.email,
        unique: true,
        admin: {
            components: {
                Field: () => null,
            },
        },
    },
    {
        name: 'resetPasswordToken',
        type: 'text',
        hidden: true,
    },
    {
        name: 'resetPasswordExpiration',
        type: 'date',
        hidden: true,
    },
];
//# sourceMappingURL=auth.js.map