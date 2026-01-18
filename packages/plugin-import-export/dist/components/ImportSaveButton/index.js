'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { SaveButton, useField, useTranslation } from '@payloadcms/ui';
export const ImportSaveButton = ()=>{
    const { t } = useTranslation();
    const { value: status } = useField({
        path: 'status'
    });
    // Only show the button if status is pending
    if (status !== 'pending') {
        return null;
    }
    return /*#__PURE__*/ _jsx(SaveButton, {
        label: t('plugin-import-export:startImport')
    });
};

//# sourceMappingURL=index.js.map