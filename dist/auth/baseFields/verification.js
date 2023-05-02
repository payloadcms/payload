"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const autoRemoveVerificationToken = ({ originalDoc, data, value, operation }) => {
    // If a user manually sets `_verified` to true,
    // and it was `false`, set _verificationToken to `null`.
    // This is useful because the admin panel
    // allows users to set `_verified` to true manually
    if (operation === 'update') {
        if ((data === null || data === void 0 ? void 0 : data._verified) === true && (originalDoc === null || originalDoc === void 0 ? void 0 : originalDoc._verified) === false) {
            return null;
        }
    }
    return value;
};
exports.default = [
    {
        name: '_verified',
        type: 'checkbox',
        access: {
            create: ({ req: { user } }) => Boolean(user),
            update: ({ req: { user } }) => Boolean(user),
            read: ({ req: { user } }) => Boolean(user),
        },
        admin: {
            components: {
                Field: () => null,
            },
        },
    },
    {
        name: '_verificationToken',
        type: 'text',
        hidden: true,
        hooks: {
            beforeChange: [
                autoRemoveVerificationToken,
            ],
        },
    },
];
//# sourceMappingURL=verification.js.map