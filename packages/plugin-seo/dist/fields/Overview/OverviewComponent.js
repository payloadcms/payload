'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useAllFormFields, useForm, useTranslation } from '@payloadcms/ui';
import React, { useEffect, useState } from 'react';
import { defaults } from '../../defaults.js';
const { description: { maxLength: maxDescDefault, minLength: minDescDefault }, title: { maxLength: maxTitleDefault, minLength: minTitleDefault } } = defaults;
export const OverviewComponent = ({ descriptionOverrides, descriptionPath: descriptionPathFromContext, imagePath: imagePathFromContext, titleOverrides, titlePath: titlePathFromContext })=>{
    const { getFields } = useForm();
    const descriptionPath = descriptionPathFromContext || 'meta.description';
    const titlePath = titlePathFromContext || 'meta.title';
    const imagePath = imagePathFromContext || 'meta.image';
    const [{ [descriptionPath]: { value: metaDesc } = {}, [imagePath]: { value: metaImage } = {}, [titlePath]: { value: metaTitle } = {} }] = useAllFormFields();
    const { t } = useTranslation();
    const [titleIsValid, setTitleIsValid] = useState();
    const [descIsValid, setDescIsValid] = useState();
    const [imageIsValid, setImageIsValid] = useState();
    const minDesc = descriptionOverrides?.minLength || minDescDefault;
    const maxDesc = descriptionOverrides?.maxLength || maxDescDefault;
    const minTitle = titleOverrides?.minLength || minTitleDefault;
    const maxTitle = titleOverrides?.maxLength || maxTitleDefault;
    useEffect(()=>{
        if (typeof metaTitle === 'string') {
            setTitleIsValid(metaTitle.length >= minTitle && metaTitle.length <= maxTitle);
        }
        if (typeof metaDesc === 'string') {
            setDescIsValid(metaDesc.length >= minDesc && metaDesc.length <= maxDesc);
        }
        setImageIsValid(Boolean(metaImage));
    }, [
        metaTitle,
        metaDesc,
        metaImage
    ]);
    const testResults = [
        titleIsValid,
        descIsValid,
        imageIsValid
    ];
    const numberOfPasses = testResults.filter(Boolean).length;
    return /*#__PURE__*/ _jsx("div", {
        style: {
            marginBottom: '20px'
        },
        children: /*#__PURE__*/ _jsx("div", {
            children: t('plugin-seo:checksPassing', {
                current: numberOfPasses,
                max: testResults.length
            })
        })
    });
};

//# sourceMappingURL=OverviewComponent.js.map