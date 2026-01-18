'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FieldError, useField } from '@payloadcms/ui';
export const ErrorBox = (props)=>{
    const { children, path } = props;
    const { errorMessage, showError } = useField({
        path
    });
    return /*#__PURE__*/ _jsxs("div", {
        className: "variantOptionsSelectorError",
        children: [
            /*#__PURE__*/ _jsx(FieldError, {
                message: errorMessage,
                path: path,
                showError: showError
            }),
            /*#__PURE__*/ _jsx("div", {
                className: [
                    'variantOptionsSelectorErrorWrapper',
                    showError && 'showError'
                ].filter(Boolean).join(' '),
                children: children
            })
        ]
    });
};

//# sourceMappingURL=ErrorBox.js.map