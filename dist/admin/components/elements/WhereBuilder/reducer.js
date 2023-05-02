"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reducer = (state, action) => {
    const newState = [
        ...state,
    ];
    const { orIndex, andIndex, } = action;
    switch (action.type) {
        case 'add': {
            const { relation, field } = action;
            if (relation === 'and') {
                newState[orIndex].and.splice(andIndex, 0, { [field]: {} });
                return newState;
            }
            return [
                ...newState,
                {
                    and: [{
                            [field]: {},
                        }],
                },
            ];
        }
        case 'remove': {
            newState[orIndex].and.splice(andIndex, 1);
            if (newState[orIndex].and.length === 0) {
                newState.splice(orIndex, 1);
            }
            return newState;
        }
        case 'update': {
            const { field, operator, value } = action;
            if (typeof newState[orIndex].and[andIndex] === 'object') {
                newState[orIndex].and[andIndex] = {
                    ...newState[orIndex].and[andIndex],
                };
                const [existingFieldName, existingCondition] = Object.entries(newState[orIndex].and[andIndex])[0] || [undefined, undefined];
                if (operator) {
                    newState[orIndex].and[andIndex] = {
                        [existingFieldName]: {
                            [operator]: Object.values(existingCondition)[0],
                        },
                    };
                }
                if (field) {
                    newState[orIndex].and[andIndex] = {
                        [field]: {
                            [Object.keys(existingCondition)[0]]: Object.values(existingCondition)[0],
                        },
                    };
                }
                if (value !== undefined) {
                    newState[orIndex].and[andIndex] = {
                        [existingFieldName]: {
                            [Object.keys(existingCondition)[0]]: value,
                        },
                    };
                }
            }
            return newState;
        }
        default: {
            return newState;
        }
    }
};
exports.default = reducer;
//# sourceMappingURL=reducer.js.map