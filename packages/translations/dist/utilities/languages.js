export const rtlLanguages = [
    'ar',
    'fa',
    'he'
];
export const acceptedLanguages = [
    'ar',
    'az',
    'bg',
    'bn-BD',
    'bn-IN',
    'ca',
    'cs',
    'bn-BD',
    'bn-IN',
    'da',
    'de',
    'en',
    'es',
    'et',
    'fa',
    'fr',
    'he',
    'hr',
    'hu',
    'hy',
    'id',
    'is',
    'it',
    'ja',
    'ko',
    'lt',
    'lv',
    'my',
    'nb',
    'nl',
    'pl',
    'pt',
    'ro',
    'rs',
    'rs-latin',
    'ru',
    'sk',
    'sl',
    'sv',
    'ta',
    'th',
    'tr',
    'uk',
    'vi',
    'zh',
    'zh-TW'
];
function parseAcceptLanguage(acceptLanguageHeader) {
    return acceptLanguageHeader.split(',').map((lang)=>{
        const [language, quality] = lang.trim().split(';q=');
        return {
            language,
            quality: quality ? parseFloat(quality) : 1
        };
    }).sort((a, b)=>b.quality - a.quality) // Sort by quality, highest to lowest
    ;
}
export function extractHeaderLanguage(acceptLanguageHeader) {
    const parsedHeader = parseAcceptLanguage(acceptLanguageHeader);
    let matchedLanguage;
    for (const { language } of parsedHeader){
        if (!matchedLanguage && acceptedLanguages.includes(language)) {
            matchedLanguage = language;
        }
    }
    return matchedLanguage;
}

//# sourceMappingURL=languages.js.map