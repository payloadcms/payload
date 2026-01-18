import { jsx as _jsx } from "react/jsx-runtime";
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent';
import { createClientFields } from 'payload';
import React from 'react';
// eslint-disable-next-line payload/no-imports-from-exports-dir
import { RichTextField } from '../exports/client/index.js';
import { elements as elementTypes } from '../field/elements/index.js';
import { defaultLeaves as leafTypes } from '../field/leaves/index.js';
import { linkFieldsSchemaPath } from './elements/link/shared.js';
import { uploadFieldsSchemaPath } from './elements/upload/shared.js';
/**
 * @deprecated - slate will be removed in 4.0. Please [migrate our new, lexical-based rich text editor](https://payloadcms.com/docs/rich-text/migration#migrating-from-slate).
 */ export const RscEntrySlateField = ({ args, clientField, forceRender, i18n, path, payload, readOnly, renderedBlocks, schemaPath })=>{
    const componentMap = new Map();
    const clientProps = {
        schemaPath
    };
    (args?.admin?.leaves || Object.values(leafTypes)).forEach((leaf)=>{
        let leafObject;
        if (typeof leaf === 'object' && leaf !== null) {
            leafObject = leaf;
        } else if (typeof leaf === 'string' && leafTypes[leaf]) {
            leafObject = leafTypes[leaf];
        }
        if (leafObject) {
            const LeafButton = leafObject.Button;
            const LeafComponent = leafObject.Leaf;
            componentMap.set(`leaf.button.${leafObject.name}`, RenderServerComponent({
                clientProps,
                Component: LeafButton,
                importMap: payload.importMap
            }));
            componentMap.set(`leaf.component.${leafObject.name}`, RenderServerComponent({
                clientProps,
                Component: LeafComponent,
                importMap: payload.importMap
            }));
            if (Array.isArray(leafObject.plugins)) {
                leafObject.plugins.forEach((Plugin, i)=>{
                    componentMap.set(`leaf.plugin.${leafObject.name}.${i}`, RenderServerComponent({
                        clientProps,
                        Component: Plugin,
                        importMap: payload.importMap
                    }));
                });
            }
        }
    });
    (args?.admin?.elements || Object.values(elementTypes)).forEach((el)=>{
        let element;
        if (typeof el === 'object' && el !== null) {
            element = el;
        } else if (typeof el === 'string' && elementTypes[el]) {
            element = elementTypes[el];
        }
        if (element) {
            const ElementButton = element.Button;
            const ElementComponent = element.Element;
            if (ElementButton) {
                componentMap.set(`element.button.${element.name}`, RenderServerComponent({
                    clientProps,
                    Component: ElementButton,
                    importMap: payload.importMap
                }));
            }
            componentMap.set(`element.component.${element.name}`, RenderServerComponent({
                clientProps,
                Component: ElementComponent,
                importMap: payload.importMap
            }));
            if (Array.isArray(element.plugins)) {
                element.plugins.forEach((Plugin, i)=>{
                    componentMap.set(`element.plugin.${element.name}.${i}`, RenderServerComponent({
                        clientProps,
                        Component: Plugin,
                        importMap: payload.importMap
                    }));
                });
            }
            switch(element.name){
                case 'link':
                    {
                        const clientFields = createClientFields({
                            defaultIDType: payload.config.db.defaultIDType,
                            fields: args.admin?.link?.fields,
                            i18n,
                            importMap: payload.importMap
                        });
                        componentMap.set(linkFieldsSchemaPath, clientFields);
                        break;
                    }
                case 'relationship':
                    break;
                case 'upload':
                    {
                        const uploadEnabledCollections = payload.config.collections.filter(({ admin: { enableRichTextRelationship, hidden }, upload })=>{
                            if (hidden === true) {
                                return false;
                            }
                            return enableRichTextRelationship && Boolean(upload) === true;
                        });
                        uploadEnabledCollections.forEach((collection)=>{
                            if (args?.admin?.upload?.collections[collection.slug]?.fields) {
                                const clientFields = createClientFields({
                                    defaultIDType: payload.config.db.defaultIDType,
                                    fields: args?.admin?.upload?.collections[collection.slug]?.fields,
                                    i18n,
                                    importMap: payload.importMap
                                });
                                componentMap.set(`${uploadFieldsSchemaPath}.${collection.slug}`, clientFields);
                            }
                        });
                        break;
                    }
            }
        }
    });
    return /*#__PURE__*/ _jsx(RichTextField, {
        componentMap: Object.fromEntries(componentMap),
        field: clientField,
        forceRender: forceRender,
        path: path,
        readOnly: readOnly,
        renderedBlocks: renderedBlocks,
        schemaPath: schemaPath
    });
};

//# sourceMappingURL=rscEntry.js.map