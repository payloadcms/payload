import { jsx as _jsx } from "react/jsx-runtime";
import { ChevronIcon, Pill, useTranslation } from '@payloadcms/ui';
export const ReindexButtonLabel = ()=>{
    const { i18n: { t } } = useTranslation();
    return /*#__PURE__*/ _jsx(Pill, {
        className: "pill--has-action",
        icon: /*#__PURE__*/ _jsx(ChevronIcon, {}),
        pillStyle: "light",
        size: "small",
        children: t('general:reindex')
    });
};

//# sourceMappingURL=index.js.map