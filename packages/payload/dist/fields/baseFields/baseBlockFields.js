import { baseIDField } from './baseIDField.js';
export const baseBlockFields = [
    baseIDField,
    {
        name: 'blockName',
        type: 'text',
        admin: {
            disabled: true
        },
        label: 'Block Name',
        required: false
    }
];

//# sourceMappingURL=baseBlockFields.js.map