import { username } from '../../fields/validations.js';
export const usernameFieldConfig = {
    name: 'username',
    type: 'text',
    admin: {
        components: {
            Field: false
        }
    },
    hooks: {
        beforeChange: [
            ({ value })=>{
                if (value) {
                    return value.toLowerCase().trim();
                }
            }
        ]
    },
    label: ({ t })=>t('authentication:username'),
    required: true,
    unique: true,
    validate: username
};

//# sourceMappingURL=username.js.map