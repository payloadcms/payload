export const baseTimezoneField = ({ name, defaultValue, label, options, required })=>{
    return {
        name: name,
        type: 'select',
        admin: {
            hidden: true
        },
        defaultValue,
        label,
        options: options,
        required
    };
};

//# sourceMappingURL=baseField.js.map