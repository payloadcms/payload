"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const buildInitialState = (data) => {
    if (data) {
        return Object.entries(data).reduce((state, [path, value]) => ({
            ...state,
            [path]: {
                value,
                initialValue: value,
                valid: true,
            },
        }), {});
    }
    return undefined;
};
exports.default = buildInitialState;
//# sourceMappingURL=buildInitialState.js.map