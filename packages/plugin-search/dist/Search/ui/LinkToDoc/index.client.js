'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CopyToClipboard, Link, useConfig, useField } from '@payloadcms/ui';
import { formatAdminURL } from 'payload/shared';
import React from 'react';
export const LinkToDocClient = ()=>{
    const { config } = useConfig();
    const { routes: { admin: adminRoute }, serverURL } = config;
    const { value } = useField({
        path: 'doc'
    });
    if (!value?.relationTo || !value?.value) {
        return null;
    }
    const href = formatAdminURL({
        adminRoute,
        path: `/collections/${value.relationTo || ''}/${value.value || ''}`,
        serverURL
    });
    return /*#__PURE__*/ _jsxs("div", {
        style: {
            marginBottom: 'var(--spacing-field, 1rem)'
        },
        children: [
            /*#__PURE__*/ _jsxs("div", {
                children: [
                    /*#__PURE__*/ _jsx("span", {
                        className: "label",
                        style: {
                            color: '#9A9A9A'
                        },
                        children: "Doc URL"
                    }),
                    /*#__PURE__*/ _jsx(CopyToClipboard, {
                        value: href
                    })
                ]
            }),
            /*#__PURE__*/ _jsx("div", {
                style: {
                    fontWeight: '600',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                },
                children: /*#__PURE__*/ _jsx(Link, {
                    href: href,
                    passHref: true,
                    rel: 'noopener noreferrer',
                    target: '_blank',
                    children: href
                })
            })
        ]
    });
};

//# sourceMappingURL=index.client.js.map