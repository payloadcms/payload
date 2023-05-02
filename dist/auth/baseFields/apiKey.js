"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const extractTranslations_1 = require("../../translations/extractTranslations");
const labels = (0, extractTranslations_1.extractTranslations)(['authentication:enableAPIKey', 'authentication:apiKey']);
const encryptKey = ({ req, value }) => (value ? req.payload.encrypt(value) : undefined);
const decryptKey = ({ req, value }) => (value ? req.payload.decrypt(value) : undefined);
exports.default = [
    {
        name: 'enableAPIKey',
        label: labels['authentication:enableAPIKey'],
        type: 'checkbox',
        defaultValue: false,
        admin: {
            components: {
                Field: () => null,
            },
        },
    },
    {
        name: 'apiKey',
        label: labels['authentication:apiKey'],
        type: 'text',
        admin: {
            components: {
                Field: () => null,
            },
        },
        hooks: {
            beforeChange: [
                encryptKey,
            ],
            afterRead: [
                decryptKey,
            ],
        },
    },
    {
        name: 'apiKeyIndex',
        type: 'text',
        hidden: true,
        admin: {
            disabled: true,
        },
        hooks: {
            beforeValidate: [
                async ({ data, req, value }) => {
                    if (data.apiKey) {
                        return crypto_1.default.createHmac('sha1', req.payload.secret)
                            .update(data.apiKey)
                            .digest('hex');
                    }
                    if (data.enableAPIKey === false) {
                        return null;
                    }
                    return value;
                },
            ],
        },
    },
];
//# sourceMappingURL=apiKey.js.map