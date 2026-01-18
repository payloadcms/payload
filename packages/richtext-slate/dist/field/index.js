'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { ShimmerEffect, useClientFunctions } from '@payloadcms/ui';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { SlatePropsProvider } from '../utilities/SlatePropsProvider.js';
import { createFeatureMap } from './createFeatureMap.js';
const RichTextEditor = /*#__PURE__*/ lazy(()=>import('./RichText.js').then((module)=>({
            default: module.RichText
        })));
export const RichTextField = (props)=>{
    const { componentMap, schemaPath } = props;
    const clientFunctions = useClientFunctions();
    const [hasLoadedPlugins, setHasLoadedPlugins] = useState(false);
    const [features] = useState(()=>{
        return createFeatureMap(new Map(Object.entries(componentMap)));
    });
    const [plugins, setPlugins] = useState([]);
    useEffect(()=>{
        if (!hasLoadedPlugins) {
            const plugins = [];
            Object.entries(clientFunctions).forEach(([key, plugin])=>{
                if (key.startsWith(`slatePlugin.${schemaPath}.`)) {
                    plugins.push(plugin);
                }
            });
            if (plugins.length === features.plugins.length) {
                setPlugins(plugins);
                setHasLoadedPlugins(true);
            }
        }
    }, [
        hasLoadedPlugins,
        clientFunctions,
        schemaPath,
        features.plugins.length
    ]);
    if (!hasLoadedPlugins) {
        return /*#__PURE__*/ _jsx(SlatePropsProvider, {
            schemaPath: schemaPath,
            children: Array.isArray(features.plugins) && features.plugins.map((Plugin, i)=>{
                return /*#__PURE__*/ _jsx(React.Fragment, {
                    children: Plugin
                }, i);
            })
        });
    }
    return /*#__PURE__*/ _jsx(Suspense, {
        fallback: /*#__PURE__*/ _jsx(ShimmerEffect, {
            height: "35vh"
        }),
        children: /*#__PURE__*/ _jsx(SlatePropsProvider, {
            schemaPath: schemaPath,
            children: /*#__PURE__*/ _jsx(RichTextEditor, {
                ...props,
                elements: features.elements,
                leaves: features.leaves,
                plugins: plugins
            })
        })
    });
};

//# sourceMappingURL=index.js.map