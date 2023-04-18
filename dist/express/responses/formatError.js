"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = __importDefault(require("../../errors/APIError"));
const formatErrorResponse = (incoming) => {
    if (incoming) {
        if (incoming instanceof APIError_1.default && incoming.data) {
            return {
                errors: [{
                        name: incoming.name,
                        message: incoming.message,
                        data: incoming.data,
                    }],
            };
        }
        // mongoose
        if (!(incoming instanceof APIError_1.default || incoming instanceof Error) && incoming.errors) {
            return {
                errors: Object.keys(incoming.errors)
                    .reduce((acc, key) => {
                    acc.push({
                        field: incoming.errors[key].path,
                        message: incoming.errors[key].message,
                    });
                    return acc;
                }, []),
            };
        }
        if (Array.isArray(incoming.message)) {
            return {
                errors: incoming.message,
            };
        }
        if (incoming.name) {
            return {
                errors: [
                    {
                        message: incoming.message,
                    },
                ],
            };
        }
    }
    return {
        errors: [
            {
                message: 'An unknown error occurred.',
            },
        ],
    };
};
exports.default = formatErrorResponse;
//# sourceMappingURL=formatError.js.map