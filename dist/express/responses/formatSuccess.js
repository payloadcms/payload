"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const formatSuccessResponse = (incoming, type) => {
    switch (type) {
        case 'message':
            return {
                message: incoming,
            };
        default:
            return incoming;
    }
};
exports.default = formatSuccessResponse;
//# sourceMappingURL=formatSuccess.js.map