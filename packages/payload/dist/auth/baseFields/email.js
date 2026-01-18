import { email } from '../../fields/validations.js';
export const emailFieldConfig = {
    name: 'email',
    type: 'email',
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
    label: ({ t })=>t('general:email'),
    required: true,
    unique: true,
    validate: email
};

//# sourceMappingURL=email.js.map