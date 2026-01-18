export const validateLimitValue = (value, t)=>{
    if (value && value < 0) {
        return t('validation:lessThanMin', {
            label: t('general:value'),
            min: 0,
            value
        });
    }
    return undefined;
};

//# sourceMappingURL=validateLimitValue.js.map