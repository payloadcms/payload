"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const extractTranslations_1 = require("../translations/extractTranslations");
const labels = (0, extractTranslations_1.extractTranslations)(['general:user', 'general:users']);
const defaultUser = {
    slug: 'users',
    labels: {
        singular: labels['general:user'],
        plural: labels['general:users'],
    },
    admin: {
        useAsTitle: 'email',
    },
    auth: {
        tokenExpiration: 7200,
    },
    fields: [],
};
exports.default = defaultUser;
//# sourceMappingURL=defaultUser.js.map