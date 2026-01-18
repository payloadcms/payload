'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { FieldDescription, FieldError, FieldLabel, RenderCustomComponent, useEditDepth, useField, useTranslation } from '@payloadcms/ui';
import { mergeFieldStyles } from '@payloadcms/ui/shared';
import { isHotkey } from 'is-hotkey';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { createEditor, Node, Element as SlateElement, Text, Transforms } from 'slate';
import { withHistory } from 'slate-history';
import { Editable, Slate, withReact } from 'slate-react';
import { defaultRichTextValue } from '../data/defaultValue.js';
import { richTextValidate } from '../data/validation.js';
import { listTypes } from './elements/listTypes.js';
import { hotkeys } from './hotkeys.js';
import { toggleLeaf } from './leaves/toggle.js';
import { withEnterBreakOut } from './plugins/withEnterBreakOut.js';
import { withHTML } from './plugins/withHTML.js';
import { ElementButtonProvider } from './providers/ElementButtonProvider.js';
import { ElementProvider } from './providers/ElementProvider.js';
import { LeafButtonProvider } from './providers/LeafButtonProvider.js';
import { LeafProvider } from './providers/LeafProvider.js';
import './index.scss';
const baseClass = 'rich-text';
const RichTextField = (props)=>{
    const { elements, field, field: { name, admin: { className, description, placeholder, readOnly: readOnlyFromAdmin } = {}, label, required }, leaves, path: pathFromProps, plugins, readOnly: readOnlyFromTopLevelProps, schemaPath: schemaPathFromProps, validate = richTextValidate } = props;
    const schemaPath = schemaPathFromProps ?? name;
    const readOnlyFromProps = readOnlyFromTopLevelProps || readOnlyFromAdmin;
    const { i18n } = useTranslation();
    const editorRef = useRef(null);
    const toolbarRef = useRef(null);
    const drawerDepth = useEditDepth();
    const drawerIsOpen = drawerDepth > 1;
    const memoizedValidate = useCallback((value, validationOptions)=>{
        if (typeof validate === 'function') {
            return validate(value, {
                ...validationOptions,
                req: {
                    t: i18n.t
                },
                required
            });
        }
    }, [
        validate,
        required,
        i18n
    ]);
    const { customComponents: { Description, Error, Label } = {}, disabled: disabledFromField, initialValue, path, setValue, showError, value } = useField({
        potentiallyStalePath: pathFromProps,
        validate: memoizedValidate
    });
    const disabled = readOnlyFromProps || disabledFromField;
    const editor = useMemo(()=>{
        let CreatedEditor = withEnterBreakOut(withHistory(withReact(createEditor())));
        CreatedEditor = withHTML(CreatedEditor);
        if (plugins.length) {
            CreatedEditor = plugins.reduce((editorWithPlugins, plugin)=>{
                return plugin(editorWithPlugins);
            }, CreatedEditor);
        }
        return CreatedEditor;
    }, [
        plugins
    ]);
    const renderElement = useCallback(({ attributes, children, element })=>{
        // return <div {...attributes}>{children}</div>
        const matchedElement = elements[element.type];
        const Element = matchedElement?.Element;
        let attr = {
            ...attributes
        };
        // this converts text alignment to margin when dealing with void elements
        if (element.textAlign) {
            if (element.type === 'relationship' || element.type === 'upload') {
                switch(element.textAlign){
                    case 'center':
                        attr = {
                            ...attr,
                            style: {
                                marginLeft: 'auto',
                                marginRight: 'auto'
                            }
                        };
                        break;
                    case 'left':
                        attr = {
                            ...attr,
                            style: {
                                marginRight: 'auto'
                            }
                        };
                        break;
                    case 'right':
                        attr = {
                            ...attr,
                            style: {
                                marginLeft: 'auto'
                            }
                        };
                        break;
                    default:
                        attr = {
                            ...attr,
                            style: {
                                textAlign: element.textAlign
                            }
                        };
                        break;
                }
            } else if (element.type === 'li') {
                switch(element.textAlign){
                    case 'center':
                        attr = {
                            ...attr,
                            style: {
                                listStylePosition: 'inside',
                                textAlign: 'center'
                            }
                        };
                        break;
                    case 'right':
                        attr = {
                            ...attr,
                            style: {
                                listStylePosition: 'inside',
                                textAlign: 'right'
                            }
                        };
                        break;
                    case 'left':
                    default:
                        attr = {
                            ...attr,
                            style: {
                                listStylePosition: 'outside',
                                textAlign: 'left'
                            }
                        };
                        break;
                }
            } else {
                attr = {
                    ...attr,
                    style: {
                        textAlign: element.textAlign
                    }
                };
            }
        }
        if (Element) {
            const el = /*#__PURE__*/ _jsx(ElementProvider, {
                attributes: attr,
                childNodes: children,
                editorRef: editorRef,
                element: element,
                fieldProps: props,
                path: path,
                schemaPath: schemaPath,
                children: Element
            });
            return el;
        }
        return /*#__PURE__*/ _jsx("div", {
            ...attr,
            children: children
        });
    }, [
        elements,
        path,
        props,
        schemaPath
    ]);
    const renderLeaf = useCallback(({ attributes, children, leaf })=>{
        const matchedLeaves = Object.entries(leaves).filter(([leafName])=>leaf[leafName]);
        if (matchedLeaves.length > 0) {
            return matchedLeaves.reduce((result, [, leafConfig], i)=>{
                if (leafConfig?.Leaf) {
                    const Leaf = leafConfig.Leaf;
                    return /*#__PURE__*/ _jsx(LeafProvider, {
                        attributes: attributes,
                        editorRef: editorRef,
                        fieldProps: props,
                        leaf: leaf,
                        path: path,
                        result: result,
                        schemaPath: schemaPath,
                        children: Leaf
                    }, i);
                }
                return result;
            }, /*#__PURE__*/ _jsx("span", {
                ...attributes,
                children: children
            }));
        }
        return /*#__PURE__*/ _jsx("span", {
            ...attributes,
            children: children
        });
    }, [
        path,
        props,
        schemaPath,
        leaves
    ]);
    // All slate changes fire the onChange event
    // including selection changes
    // so we will filter the set_selection operations out
    // and only fire setValue when onChange is because of value
    const handleChange = useCallback((val)=>{
        const ops = editor?.operations.filter((o)=>{
            if (o) {
                return o.type !== 'set_selection';
            }
            return false;
        });
        if (ops && Array.isArray(ops) && ops.length > 0) {
            if (!disabled && val !== defaultRichTextValue && val !== value) {
                setValue(val);
            }
        }
    }, [
        editor?.operations,
        disabled,
        setValue,
        value
    ]);
    useEffect(()=>{
        function setClickableState(clickState) {
            const selectors = 'button, a, [role="button"]';
            const toolbarButtons = toolbarRef.current?.querySelectorAll(selectors);
            (toolbarButtons || []).forEach((child)=>{
                const isButton = child.tagName === 'BUTTON';
                const isDisabling = clickState === 'disabled';
                child.setAttribute('tabIndex', isDisabling ? '-1' : '0');
                if (isButton) {
                    child.setAttribute('disabled', isDisabling ? 'disabled' : null);
                }
            });
        }
        if (disabled) {
            setClickableState('disabled');
        }
        return ()=>{
            if (disabled) {
                setClickableState('enabled');
            }
        };
    }, [
        disabled
    ]);
    // useEffect(() => {
    //   // If there is a change to the initial value, we need to reset Slate history
    //   // and clear selection because the old selection may no longer be valid
    //   // as returned JSON may be modified in hooks and have a different shape
    //   if (editor.selection) {
    //     console.log('deselecting');
    //     ReactEditor.deselect(editor);
    //   }
    // }, [path, editor]);
    const styles = useMemo(()=>mergeFieldStyles(field), [
        field
    ]);
    const classes = [
        baseClass,
        'field-type',
        className,
        showError && 'error',
        disabled && `${baseClass}--read-only`
    ].filter(Boolean).join(' ');
    let valueToRender = value;
    if (typeof valueToRender === 'string') {
        try {
            const parsedJSON = JSON.parse(valueToRender);
            valueToRender = parsedJSON;
        } catch (err) {
            valueToRender = null;
        }
    }
    if (!valueToRender) {
        valueToRender = defaultRichTextValue;
    }
    return /*#__PURE__*/ _jsxs("div", {
        className: classes,
        style: styles,
        children: [
            Label || /*#__PURE__*/ _jsx(FieldLabel, {
                label: label,
                path: path,
                required: required
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: `${baseClass}__wrap`,
                children: [
                    /*#__PURE__*/ _jsx(RenderCustomComponent, {
                        CustomComponent: Error,
                        Fallback: /*#__PURE__*/ _jsx(FieldError, {
                            path: path,
                            showError: showError
                        })
                    }),
                    /*#__PURE__*/ _jsx(Slate, {
                        editor: editor,
                        onChange: handleChange,
                        value: valueToRender,
                        children: /*#__PURE__*/ _jsxs("div", {
                            className: `${baseClass}__wrapper`,
                            children: [
                                Object.keys(elements)?.length + Object.keys(leaves)?.length > 0 && /*#__PURE__*/ _jsx("div", {
                                    className: [
                                        `${baseClass}__toolbar`,
                                        drawerIsOpen && `${baseClass}__drawerIsOpen`
                                    ].filter(Boolean).join(' '),
                                    ref: toolbarRef,
                                    children: /*#__PURE__*/ _jsxs("div", {
                                        className: `${baseClass}__toolbar-wrap`,
                                        children: [
                                            Object.values(elements).map((element)=>{
                                                const Button = element?.Button;
                                                if (Button) {
                                                    return /*#__PURE__*/ _jsx(ElementButtonProvider, {
                                                        disabled: disabled,
                                                        fieldProps: props,
                                                        path: path,
                                                        schemaPath: schemaPath,
                                                        children: Button
                                                    }, element.name);
                                                }
                                                return null;
                                            }),
                                            Object.values(leaves).map((leaf)=>{
                                                const Button = leaf?.Button;
                                                if (Button) {
                                                    return /*#__PURE__*/ _jsx(LeafButtonProvider, {
                                                        fieldProps: props,
                                                        path: path,
                                                        schemaPath: schemaPath,
                                                        children: Button
                                                    }, leaf.name);
                                                }
                                                return null;
                                            })
                                        ]
                                    })
                                }),
                                /*#__PURE__*/ _jsx("div", {
                                    className: `${baseClass}__editor`,
                                    ref: editorRef,
                                    children: /*#__PURE__*/ _jsx(Editable, {
                                        className: `${baseClass}__input`,
                                        id: `field-${path.replace(/\./g, '__')}`,
                                        onKeyDown: (event)=>{
                                            if (event.key === 'Enter') {
                                                if (event.shiftKey) {
                                                    event.preventDefault();
                                                    editor.insertText('\n');
                                                } else {
                                                    const selectedElement = Node.descendant(editor, editor.selection.anchor.path.slice(0, -1));
                                                    if (SlateElement.isElement(selectedElement)) {
                                                        // Allow hard enter to "break out" of certain elements
                                                        if (editor.shouldBreakOutOnEnter(selectedElement)) {
                                                            event.preventDefault();
                                                            const selectedLeaf = Node.descendant(editor, editor.selection.anchor.path);
                                                            if (Text.isText(selectedLeaf) && String(selectedLeaf.text).length === editor.selection.anchor.offset) {
                                                                Transforms.insertNodes(editor, {
                                                                    children: [
                                                                        {
                                                                            text: ''
                                                                        }
                                                                    ]
                                                                });
                                                            } else {
                                                                Transforms.splitNodes(editor);
                                                                Transforms.setNodes(editor, {});
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                            if (event.key === 'Backspace') {
                                                const selectedElement = Node.descendant(editor, editor.selection.anchor.path.slice(0, -1));
                                                if (SlateElement.isElement(selectedElement) && selectedElement.type === 'li') {
                                                    const selectedLeaf = Node.descendant(editor, editor.selection.anchor.path);
                                                    if (Text.isText(selectedLeaf) && String(selectedLeaf.text).length === 0) {
                                                        event.preventDefault();
                                                        Transforms.unwrapNodes(editor, {
                                                            match: (n)=>SlateElement.isElement(n) && listTypes.includes(n.type),
                                                            mode: 'lowest',
                                                            split: true
                                                        });
                                                        Transforms.setNodes(editor, {
                                                            type: undefined
                                                        });
                                                    }
                                                } else if (editor.isVoid(selectedElement)) {
                                                    Transforms.removeNodes(editor);
                                                }
                                            }
                                            Object.keys(hotkeys).forEach((hotkey)=>{
                                                if (isHotkey(hotkey, event)) {
                                                    event.preventDefault();
                                                    const mark = hotkeys[hotkey];
                                                    toggleLeaf(editor, mark);
                                                }
                                            });
                                        },
                                        placeholder: getTranslation(placeholder, i18n),
                                        readOnly: disabled,
                                        renderElement: renderElement,
                                        renderLeaf: renderLeaf,
                                        spellCheck: true
                                    })
                                })
                            ]
                        })
                    }, JSON.stringify({
                        initialValue,
                        path
                    })),
                    /*#__PURE__*/ _jsx(RenderCustomComponent, {
                        CustomComponent: Description,
                        Fallback: /*#__PURE__*/ _jsx(FieldDescription, {
                            description: description,
                            path: path
                        })
                    })
                ]
            })
        ]
    });
};
export const RichText = RichTextField;

//# sourceMappingURL=RichText.js.map