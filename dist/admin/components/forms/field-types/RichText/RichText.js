"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const is_hotkey_1 = __importDefault(require("is-hotkey"));
const slate_1 = require("slate");
const slate_react_1 = require("slate-react");
const slate_history_1 = require("slate-history");
const react_i18next_1 = require("react-i18next");
const validations_1 = require("../../../../../fields/validations");
const useField_1 = __importDefault(require("../../useField"));
const withCondition_1 = __importDefault(require("../../withCondition"));
const Label_1 = __importDefault(require("../../Label"));
const Error_1 = __importDefault(require("../../Error"));
const leaves_1 = __importDefault(require("./leaves"));
const elements_1 = __importDefault(require("./elements"));
const toggle_1 = __importDefault(require("./leaves/toggle"));
const hotkeys_1 = __importDefault(require("./hotkeys"));
const enablePlugins_1 = __importDefault(require("./enablePlugins"));
const defaultValue_1 = __importDefault(require("../../../../../fields/richText/defaultValue"));
const FieldDescription_1 = __importDefault(require("../../FieldDescription"));
const withHTML_1 = __importDefault(require("./plugins/withHTML"));
const listTypes_1 = __importDefault(require("./elements/listTypes"));
const mergeCustomFunctions_1 = __importDefault(require("./mergeCustomFunctions"));
const withEnterBreakOut_1 = __importDefault(require("./plugins/withEnterBreakOut"));
const getTranslation_1 = require("../../../../../utilities/getTranslation");
const EditDepth_1 = require("../../../utilities/EditDepth");
require("./index.scss");
const defaultElements = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'indent', 'link', 'relationship', 'upload'];
const defaultLeaves = ['bold', 'italic', 'underline', 'strikethrough', 'code'];
const baseClass = 'rich-text';
const RichText = (props) => {
    const { path: pathFromProps, name, required, validate = validations_1.richText, label, defaultValue: defaultValueFromProps, admin, admin: { readOnly, style, className, width, placeholder, description, condition, hideGutter, } = {}, } = props;
    const elements = (admin === null || admin === void 0 ? void 0 : admin.elements) || defaultElements;
    const leaves = (admin === null || admin === void 0 ? void 0 : admin.leaves) || defaultLeaves;
    const path = pathFromProps || name;
    const { i18n } = (0, react_i18next_1.useTranslation)();
    const [loaded, setLoaded] = (0, react_1.useState)(false);
    const [enabledElements, setEnabledElements] = (0, react_1.useState)({});
    const [enabledLeaves, setEnabledLeaves] = (0, react_1.useState)({});
    const editorRef = (0, react_1.useRef)(null);
    const toolbarRef = (0, react_1.useRef)(null);
    const drawerDepth = (0, EditDepth_1.useEditDepth)();
    const drawerIsOpen = drawerDepth > 1;
    const renderElement = (0, react_1.useCallback)(({ attributes, children, element }) => {
        const matchedElement = enabledElements[element === null || element === void 0 ? void 0 : element.type];
        const Element = matchedElement === null || matchedElement === void 0 ? void 0 : matchedElement.Element;
        if (Element) {
            return (react_1.default.createElement(Element, { attributes: attributes, element: element, path: path, fieldProps: props, editorRef: editorRef }, children));
        }
        return react_1.default.createElement("div", { ...attributes }, children);
    }, [enabledElements, path, props]);
    const renderLeaf = (0, react_1.useCallback)(({ attributes, children, leaf }) => {
        const matchedLeaves = Object.entries(enabledLeaves).filter(([leafName]) => leaf[leafName]);
        if (matchedLeaves.length > 0) {
            return matchedLeaves.reduce((result, [leafName], i) => {
                var _a, _b;
                if ((_a = enabledLeaves[leafName]) === null || _a === void 0 ? void 0 : _a.Leaf) {
                    const Leaf = (_b = enabledLeaves[leafName]) === null || _b === void 0 ? void 0 : _b.Leaf;
                    return (react_1.default.createElement(Leaf, { key: i, leaf: leaf, path: path, fieldProps: props, editorRef: editorRef }, result));
                }
                return result;
            }, react_1.default.createElement("span", { ...attributes }, children));
        }
        return (react_1.default.createElement("span", { ...attributes }, children));
    }, [enabledLeaves, path, props]);
    const memoizedValidate = (0, react_1.useCallback)((value, validationOptions) => {
        return validate(value, { ...validationOptions, required });
    }, [validate, required]);
    const fieldType = (0, useField_1.default)({
        path,
        validate: memoizedValidate,
        condition,
    });
    const { value, showError, setValue, errorMessage, initialValue, } = fieldType;
    const classes = [
        baseClass,
        'field-type',
        className,
        showError && 'error',
        readOnly && `${baseClass}--read-only`,
        !hideGutter && `${baseClass}--gutter`,
    ].filter(Boolean).join(' ');
    const editor = (0, react_1.useMemo)(() => {
        let CreatedEditor = (0, withEnterBreakOut_1.default)((0, slate_history_1.withHistory)((0, slate_react_1.withReact)((0, slate_1.createEditor)())));
        CreatedEditor = (0, withHTML_1.default)(CreatedEditor);
        CreatedEditor = (0, enablePlugins_1.default)(CreatedEditor, elements);
        CreatedEditor = (0, enablePlugins_1.default)(CreatedEditor, leaves);
        return CreatedEditor;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [elements, leaves, path]);
    // All slate changes fire the onChange event
    // including selection changes
    // so we will filter the set_selection operations out
    // and only fire setValue when onChange is because of value
    const handleChange = (0, react_1.useCallback)((val) => {
        const ops = editor.operations.filter((o) => {
            if (o) {
                return o.type !== 'set_selection';
            }
            return false;
        });
        if (ops && Array.isArray(ops) && ops.length > 0) {
            if (!readOnly && val !== defaultValue_1.default && val !== value) {
                setValue(val);
            }
        }
    }, [editor.operations, readOnly, setValue, value]);
    (0, react_1.useEffect)(() => {
        if (!loaded) {
            const mergedElements = (0, mergeCustomFunctions_1.default)(elements, elements_1.default);
            const mergedLeaves = (0, mergeCustomFunctions_1.default)(leaves, leaves_1.default);
            setEnabledElements(mergedElements);
            setEnabledLeaves(mergedLeaves);
            setLoaded(true);
        }
    }, [loaded, elements, leaves]);
    (0, react_1.useEffect)(() => {
        function setClickableState(clickState) {
            var _a;
            const selectors = 'button, a, [role="button"]';
            const toolbarButtons = (_a = toolbarRef.current) === null || _a === void 0 ? void 0 : _a.querySelectorAll(selectors);
            (toolbarButtons || []).forEach((child) => {
                const isButton = child.tagName === 'BUTTON';
                const isDisabling = clickState === 'disabled';
                child.setAttribute('tabIndex', isDisabling ? '-1' : '0');
                if (isButton)
                    child.setAttribute('disabled', isDisabling ? 'disabled' : null);
            });
        }
        if (loaded && readOnly) {
            setClickableState('disabled');
        }
        return () => {
            if (loaded && readOnly) {
                setClickableState('enabled');
            }
        };
    }, [loaded, readOnly]);
    // useEffect(() => {
    //   // If there is a change to the initial value, we need to reset Slate history
    //   // and clear selection because the old selection may no longer be valid
    //   // as returned JSON may be modified in hooks and have a different shape
    //   if (editor.selection) {
    //     console.log('deselecting');
    //     ReactEditor.deselect(editor);
    //   }
    // }, [path, editor]);
    if (!loaded) {
        return null;
    }
    let valueToRender = value;
    if (typeof valueToRender === 'string') {
        try {
            const parsedJSON = JSON.parse(valueToRender);
            valueToRender = parsedJSON;
        }
        catch (err) {
            // do nothing
        }
    }
    if (!valueToRender)
        valueToRender = defaultValueFromProps || defaultValue_1.default;
    return (react_1.default.createElement("div", { className: classes, style: {
            ...style,
            width,
        } },
        react_1.default.createElement("div", { className: `${baseClass}__wrap` },
            react_1.default.createElement(Error_1.default, { showError: showError, message: errorMessage }),
            react_1.default.createElement(Label_1.default, { htmlFor: `field-${path.replace(/\./gi, '__')}`, label: label, required: required }),
            react_1.default.createElement(slate_react_1.Slate, { key: JSON.stringify(initialValue), editor: editor, value: valueToRender, onChange: handleChange },
                react_1.default.createElement("div", { className: `${baseClass}__wrapper` },
                    react_1.default.createElement("div", { className: [
                            `${baseClass}__toolbar`,
                            drawerIsOpen && `${baseClass}__drawerIsOpen`,
                        ].filter(Boolean).join(' '), ref: toolbarRef },
                        react_1.default.createElement("div", { className: `${baseClass}__toolbar-wrap` },
                            elements.map((element, i) => {
                                let elementName;
                                if (typeof element === 'object' && (element === null || element === void 0 ? void 0 : element.name))
                                    elementName = element.name;
                                if (typeof element === 'string')
                                    elementName = element;
                                const elementType = enabledElements[elementName];
                                const Button = elementType === null || elementType === void 0 ? void 0 : elementType.Button;
                                if (Button) {
                                    return (react_1.default.createElement(Button, { fieldProps: props, key: i, path: path }));
                                }
                                return null;
                            }),
                            leaves.map((leaf, i) => {
                                let leafName;
                                if (typeof leaf === 'object' && (leaf === null || leaf === void 0 ? void 0 : leaf.name))
                                    leafName = leaf.name;
                                if (typeof leaf === 'string')
                                    leafName = leaf;
                                const leafType = enabledLeaves[leafName];
                                const Button = leafType === null || leafType === void 0 ? void 0 : leafType.Button;
                                if (Button) {
                                    return (react_1.default.createElement(Button, { fieldProps: props, key: i, path: path }));
                                }
                                return null;
                            }))),
                    react_1.default.createElement("div", { className: `${baseClass}__editor`, ref: editorRef },
                        react_1.default.createElement(slate_react_1.Editable, { id: `field-${path.replace(/\./gi, '__')}`, className: `${baseClass}__input`, renderElement: renderElement, renderLeaf: renderLeaf, placeholder: (0, getTranslation_1.getTranslation)(placeholder, i18n), spellCheck: true, readOnly: readOnly, onKeyDown: (event) => {
                                if (event.key === 'Enter') {
                                    if (event.shiftKey) {
                                        event.preventDefault();
                                        editor.insertText('\n');
                                    }
                                    else {
                                        const selectedElement = slate_1.Node.descendant(editor, editor.selection.anchor.path.slice(0, -1));
                                        if (slate_1.Element.isElement(selectedElement)) {
                                            // Allow hard enter to "break out" of certain elements
                                            if (editor.shouldBreakOutOnEnter(selectedElement)) {
                                                event.preventDefault();
                                                const selectedLeaf = slate_1.Node.descendant(editor, editor.selection.anchor.path);
                                                if (slate_1.Text.isText(selectedLeaf) && String(selectedLeaf.text).length === editor.selection.anchor.offset) {
                                                    slate_1.Transforms.insertNodes(editor, { children: [{ text: '' }] });
                                                }
                                                else {
                                                    slate_1.Transforms.splitNodes(editor);
                                                    slate_1.Transforms.setNodes(editor, {});
                                                }
                                            }
                                        }
                                    }
                                }
                                if (event.key === 'Backspace') {
                                    const selectedElement = slate_1.Node.descendant(editor, editor.selection.anchor.path.slice(0, -1));
                                    if (slate_1.Element.isElement(selectedElement) && selectedElement.type === 'li') {
                                        const selectedLeaf = slate_1.Node.descendant(editor, editor.selection.anchor.path);
                                        if (slate_1.Text.isText(selectedLeaf) && String(selectedLeaf.text).length === 0) {
                                            event.preventDefault();
                                            slate_1.Transforms.unwrapNodes(editor, {
                                                match: (n) => slate_1.Element.isElement(n) && listTypes_1.default.includes(n.type),
                                                split: true,
                                                mode: 'lowest',
                                            });
                                            slate_1.Transforms.setNodes(editor, { type: undefined });
                                        }
                                    }
                                    else if (editor.isVoid(selectedElement)) {
                                        slate_1.Transforms.removeNodes(editor);
                                    }
                                }
                                Object.keys(hotkeys_1.default).forEach((hotkey) => {
                                    if ((0, is_hotkey_1.default)(hotkey, event)) {
                                        event.preventDefault();
                                        const mark = hotkeys_1.default[hotkey];
                                        (0, toggle_1.default)(editor, mark);
                                    }
                                });
                            } })))),
            react_1.default.createElement(FieldDescription_1.default, { value: value, description: description }))));
};
exports.default = (0, withCondition_1.default)(RichText);
//# sourceMappingURL=RichText.js.map