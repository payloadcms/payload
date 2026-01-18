/**
 * Sanitize the resize config. If the resize config has the `withoutReduction`
 * property set to true, the `fit` and `position` properties will be set to `contain`
 * and `top left` respectively.
 *
 * @param resizeConfig - the resize config
 * @returns a sanitized resize config
 */ export const sanitizeResizeConfig = (resizeConfig)=>{
    if (resizeConfig.withoutReduction) {
        return {
            ...resizeConfig,
            // Why fit `contain` should also be set to https://github.com/lovell/sharp/issues/3595
            fit: resizeConfig?.fit || 'contain',
            position: resizeConfig?.position || 'left top'
        };
    }
    return resizeConfig;
};

//# sourceMappingURL=sanitizeResizeConfig.js.map