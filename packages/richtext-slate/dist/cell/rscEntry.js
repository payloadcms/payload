import { jsx as _jsx } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { Link } from '@payloadcms/ui';
import { formatAdminURL } from 'payload/shared';
import React from 'react';
/**
 * @deprecated - slate will be removed in 4.0. Please [migrate our new, lexical-based rich text editor](https://payloadcms.com/docs/rich-text/migration#migrating-from-slate).
 */ export const RscEntrySlateCell = (props)=>{
    const { cellData, className: classNameFromProps, collectionConfig, field: { admin }, field, i18n, link, onClick: onClickFromProps, payload, rowData } = props;
    const classNameFromConfigContext = admin && 'className' in admin ? admin.className : undefined;
    const className = classNameFromProps || (field.admin && 'className' in field.admin ? field.admin.className : null) || classNameFromConfigContext;
    const adminRoute = payload.config.routes.admin;
    const serverURL = payload.config.serverURL;
    const onClick = onClickFromProps;
    let WrapElement = 'span';
    const wrapElementProps = {
        className
    };
    if (link) {
        wrapElementProps.prefetch = false;
        WrapElement = Link;
        wrapElementProps.href = collectionConfig?.slug ? formatAdminURL({
            adminRoute,
            path: `/collections/${collectionConfig?.slug}/${rowData.id}`,
            serverURL
        }) : '';
    }
    if (typeof onClick === 'function') {
        WrapElement = 'button';
        wrapElementProps.type = 'button';
        wrapElementProps.onClick = ()=>{
            onClick({
                cellData,
                collectionSlug: collectionConfig?.slug,
                rowData
            });
        };
    }
    let textContent = '';
    if (cellData) {
        textContent = cellData?.map((i)=>i?.children?.map((c)=>c.text)).join(' ');
    }
    if (!cellData || !textContent?.length) {
        textContent = i18n.t('general:noLabel', {
            label: getTranslation(('label' in field ? field.label : null) || 'data', i18n)
        });
    }
    return /*#__PURE__*/ _jsx(WrapElement, {
        ...wrapElementProps,
        children: textContent
    });
};

//# sourceMappingURL=rscEntry.js.map