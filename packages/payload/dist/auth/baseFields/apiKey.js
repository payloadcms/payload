import crypto from 'crypto';
const encryptKey = ({ req, value })=>value ? req.payload.encrypt(value) : null;
const decryptKey = ({ req, value })=>value ? req.payload.decrypt(value) : undefined;
export const apiKeyFields = [
    {
        name: 'enableAPIKey',
        type: 'checkbox',
        admin: {
            components: {
                Field: false
            }
        },
        label: ({ t })=>t('authentication:enableAPIKey')
    },
    {
        name: 'apiKey',
        type: 'text',
        admin: {
            components: {
                Field: false
            }
        },
        hooks: {
            afterRead: [
                decryptKey
            ],
            beforeChange: [
                encryptKey
            ]
        },
        label: ({ t })=>t('authentication:apiKey')
    },
    {
        name: 'apiKeyIndex',
        type: 'text',
        admin: {
            disabled: true
        },
        hidden: true,
        hooks: {
            beforeValidate: [
                ({ data, req, value })=>{
                    if (data?.apiKey === false || data?.apiKey === null) {
                        return null;
                    }
                    if (data?.enableAPIKey === false || data?.enableAPIKey === null) {
                        return null;
                    }
                    if (data?.apiKey) {
                        return crypto.createHmac('sha256', req.payload.secret).update(data.apiKey).digest('hex');
                    }
                    return value;
                }
            ]
        }
    }
];

//# sourceMappingURL=apiKey.js.map