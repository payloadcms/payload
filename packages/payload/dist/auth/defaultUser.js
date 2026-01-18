export const defaultUserCollection = {
    slug: 'users',
    admin: {
        useAsTitle: 'email'
    },
    auth: {
        tokenExpiration: 7200
    },
    fields: [],
    labels: {
        plural: ({ t })=>t('general:users'),
        singular: ({ t })=>t('general:user')
    }
};

//# sourceMappingURL=defaultUser.js.map