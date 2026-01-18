import { defaultRichTextValue } from './defaultValue.js';
export const richTextValidate = (value, { req, required })=>{
    const { t } = req;
    if (required) {
        const stringifiedDefaultValue = JSON.stringify(defaultRichTextValue);
        if (value && JSON.stringify(value) !== stringifiedDefaultValue) {
            return true;
        }
        return t('validation:required');
    }
    return true;
};

//# sourceMappingURL=validation.js.map