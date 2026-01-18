'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from '@payloadcms/ui';
import React, { Fragment, useEffect, useState } from 'react';
import { Pill } from './Pill.js';
export const LengthIndicator = (props)=>{
    const { maxLength = 0, minLength = 0, text } = props;
    const [labelStyle, setLabelStyle] = useState({
        backgroundColor: '',
        color: ''
    });
    const [label, setLabel] = useState('');
    const [barWidth, setBarWidth] = useState(0);
    const { t } = useTranslation();
    useEffect(()=>{
        const textLength = text?.length || 0;
        if (textLength === 0) {
            setLabel(t('plugin-seo:missing'));
            setLabelStyle({
                backgroundColor: 'red',
                color: 'white'
            });
            setBarWidth(0);
        } else {
            const progress = (textLength - minLength) / (maxLength - minLength);
            if (progress < 0) {
                const ratioUntilMin = textLength / minLength;
                if (ratioUntilMin > 0.9) {
                    setLabel(t('plugin-seo:almostThere'));
                    setLabelStyle({
                        backgroundColor: 'orange',
                        color: 'white'
                    });
                } else {
                    setLabel(t('plugin-seo:tooShort'));
                    setLabelStyle({
                        backgroundColor: 'orangered',
                        color: 'white'
                    });
                }
                setBarWidth(ratioUntilMin);
            }
            if (progress >= 0 && progress <= 1) {
                setLabel(t('plugin-seo:good'));
                setLabelStyle({
                    backgroundColor: 'green',
                    color: 'white'
                });
                setBarWidth(progress);
            }
            if (progress > 1) {
                setLabel(t('plugin-seo:tooLong'));
                setLabelStyle({
                    backgroundColor: 'red',
                    color: 'white'
                });
                setBarWidth(1);
            }
        }
    }, [
        minLength,
        maxLength,
        text,
        t
    ]);
    const textLength = text?.length || 0;
    const charsUntilMax = maxLength - textLength;
    const charsUntilMin = minLength - textLength;
    return /*#__PURE__*/ _jsxs("div", {
        style: {
            alignItems: 'center',
            display: 'flex',
            width: '100%'
        },
        children: [
            /*#__PURE__*/ _jsx(Pill, {
                backgroundColor: labelStyle.backgroundColor,
                color: labelStyle.color,
                label: label
            }),
            /*#__PURE__*/ _jsx("div", {
                style: {
                    flexShrink: 0,
                    lineHeight: 1,
                    marginRight: '10px',
                    whiteSpace: 'nowrap'
                },
                children: /*#__PURE__*/ _jsxs("small", {
                    children: [
                        t('plugin-seo:characterCount', {
                            current: text?.length || 0,
                            maxLength,
                            minLength
                        }),
                        (textLength === 0 || charsUntilMin > 0) && /*#__PURE__*/ _jsx(Fragment, {
                            children: t('plugin-seo:charactersToGo', {
                                characters: charsUntilMin
                            })
                        }),
                        charsUntilMin <= 0 && charsUntilMax >= 0 && /*#__PURE__*/ _jsx(Fragment, {
                            children: t('plugin-seo:charactersLeftOver', {
                                characters: charsUntilMax
                            })
                        }),
                        charsUntilMax < 0 && /*#__PURE__*/ _jsx(Fragment, {
                            children: t('plugin-seo:charactersTooMany', {
                                characters: charsUntilMax * -1
                            })
                        })
                    ]
                })
            }),
            /*#__PURE__*/ _jsx("div", {
                style: {
                    backgroundColor: '#F3F3F3',
                    height: '2px',
                    position: 'relative',
                    width: '100%'
                },
                children: /*#__PURE__*/ _jsx("div", {
                    style: {
                        backgroundColor: labelStyle.backgroundColor,
                        height: '100%',
                        left: 0,
                        position: 'absolute',
                        top: 0,
                        width: `${barWidth * 100}%`
                    }
                })
            })
        ]
    });
};

//# sourceMappingURL=LengthIndicator.js.map