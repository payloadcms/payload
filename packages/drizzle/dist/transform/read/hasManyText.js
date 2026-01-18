export const transformHasManyText = ({ field, locale, ref, textRows, withinArrayOrBlockLocale })=>{
    let result;
    if (withinArrayOrBlockLocale) {
        result = textRows.reduce((acc, { locale, text })=>{
            if (locale === withinArrayOrBlockLocale) {
                acc.push(text);
            }
            return acc;
        }, []);
    } else {
        result = textRows.map(({ text })=>text);
    }
    if (locale) {
        ref[field.name][locale] = result;
    } else {
        ref[field.name] = result;
    }
};

//# sourceMappingURL=hasManyText.js.map