export async function applyLocaleFiltering({ clientConfig, config, req }) {
    if (!clientConfig.localization || !config.localization || typeof config.localization.filterAvailableLocales !== 'function') {
        return;
    }
    const filteredLocales = (await config.localization.filterAvailableLocales({
        locales: config.localization.locales,
        req
    })).map(({ toString, ...rest })=>rest);
    clientConfig.localization.localeCodes = filteredLocales.map(({ code })=>code);
    clientConfig.localization.locales = filteredLocales;
}

//# sourceMappingURL=applyLocaleFiltering.js.map