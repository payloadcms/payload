'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, SaveButton, toast, Translation, useConfig, useForm, useFormModified, useTranslation } from '@payloadcms/ui';
import { formatAdminURL } from 'payload/shared';
import React from 'react';
export const ExportSaveButton = ()=>{
    const { t } = useTranslation();
    const { config: { routes: { api } }, getEntityConfig } = useConfig();
    const { getData, setModified } = useForm();
    const modified = useFormModified();
    const exportsCollectionConfig = getEntityConfig({
        collectionSlug: 'exports'
    });
    const disableSave = exportsCollectionConfig?.admin?.custom?.disableSave === true;
    const disableDownload = exportsCollectionConfig?.admin?.custom?.disableDownload === true;
    const label = t('general:save');
    const handleDownload = async ()=>{
        let timeoutID = null;
        let toastID = null;
        try {
            setModified(false); // Reset modified state
            const data = getData();
            // Set a timeout to show toast if the request takes longer than 200ms
            timeoutID = setTimeout(()=>{
                toastID = toast.success('Your export is being processed...');
            }, 200);
            const response = await fetch(formatAdminURL({
                apiRoute: api,
                path: '/exports/download'
            }), {
                body: JSON.stringify({
                    data
                }),
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST'
            });
            // Clear the timeout if fetch completes quickly
            if (timeoutID) {
                clearTimeout(timeoutID);
            }
            // Dismiss the toast if it was shown
            if (toastID) {
                toast.dismiss(toastID);
            }
            if (!response.ok) {
                // Try to parse the error message from the JSON response
                let errorMsg = 'Failed to download file';
                try {
                    const errorJson = await response.json();
                    if (errorJson?.errors?.[0]?.message) {
                        errorMsg = errorJson.errors[0].message;
                    }
                } catch  {
                // Ignore JSON parse errors, fallback to generic message
                }
                throw new Error(errorMsg);
            }
            const fileStream = response.body;
            const reader = fileStream?.getReader();
            const decoder = new TextDecoder();
            let result = '';
            while(reader){
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }
                result += decoder.decode(value, {
                    stream: true
                });
            }
            const blob = new Blob([
                result
            ], {
                type: 'text/plain'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${data.name}.${data.format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            toast.error(error.message || 'Error downloading file');
        }
    };
    return /*#__PURE__*/ _jsxs(React.Fragment, {
        children: [
            !disableSave && /*#__PURE__*/ _jsx(SaveButton, {
                label: label
            }),
            !disableDownload && /*#__PURE__*/ _jsx(Button, {
                disabled: !modified,
                onClick: handleDownload,
                size: "medium",
                type: "button",
                children: /*#__PURE__*/ _jsx(Translation, {
                    i18nKey: "upload:download",
                    t: t
                })
            })
        ]
    });
};

//# sourceMappingURL=index.js.map