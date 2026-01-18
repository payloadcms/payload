'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CopyToClipboard, useFormFields } from '@payloadcms/ui';
import React from 'react';
export const LinkToDoc = (props)=>{
    const { field: { admin: { custom = {} } = {} } } = props;
    const { isTestKey, nameOfIDField, stripeResourceType } = custom;
    const field = useFormFields(([fields])=>fields && fields?.[nameOfIDField] || null);
    const { value: stripeID } = field || {};
    const stripeEnv = isTestKey ? 'test/' : '';
    const href = `https://dashboard.stripe.com/${stripeEnv}${stripeResourceType}/${stripeID}`;
    if (stripeID) {
        return /*#__PURE__*/ _jsxs("div", {
            children: [
                /*#__PURE__*/ _jsxs("div", {
                    children: [
                        /*#__PURE__*/ _jsx("span", {
                            className: "label",
                            style: {
                                color: '#9A9A9A'
                            },
                            children: "View in Stripe"
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
                    children: /*#__PURE__*/ _jsx("a", {
                        href: href,
                        rel: "noreferrer noopener",
                        target: "_blank",
                        children: href
                    })
                })
            ]
        });
    }
    return null;
};

//# sourceMappingURL=LinkToDoc.js.map