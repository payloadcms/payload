import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import isHotkey from 'is-hotkey';
import { createEditor, Transforms, Node, Element as SlateElement, Text, BaseEditor, BaseOperation } from 'slate';
import { ReactEditor, Editable, withReact, Slate } from 'slate-react';
import { HistoryEditor, withHistory } from 'slate-history';
import { useTranslation } from 'react-i18next';
import { richText } from '../../../../../fields/validations';
import useField from '../../useField';
import withCondition from '../../withCondition';
import Label from '../../Label';
import Error from '../../Error';
import leafTypes from './leaves';
import elementTypes from './elements';
import toggleLeaf from './leaves/toggle';
import hotkeys from './hotkeys';
import enablePlugins from './enablePlugins';
import defaultValue from '../../../../../fields/richText/defaultValue';
import FieldDescription from '../../FieldDescription';
import withHTML from './plugins/withHTML';
import { ElementNode, TextNode, Props } from './types';
import { RichTextElement, RichTextLeaf } from '../../../../../fields/config/types';
import listTypes from './elements/listTypes';
import mergeCustomFunctions from './mergeCustomFunctions';
import withEnterBreakOut from './plugins/withEnterBreakOut';
import { getTranslation } from '../../../../../utilities/getTranslation';
import { useEditDepth } from '../../../utilities/EditDepth';

import './index.scss';

const defaultElements: RichTextElement[] = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'indent', 'link', 'relationship', 'upload'];
const defaultLeaves: RichTextLeaf[] = ['bold', 'italic', 'underline', 'strikethrough', 'code'];

const baseClass = 'rich-text';

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor
    Element: ElementNode
    Text: TextNode
  }
}

const RichText: React.FC<Props> = (props) => {
  const {
    path: pathFromProps,
    name,
    required,
    validate = richText,
    label,
    defaultValue: defaultValueFromProps,
    admin,
    admin: {
      readOnly,
      style,
      className,
      width,
      placeholder,
      description,
      condition,
      hideGutter,
    } = {},
  } = props;

  const elements: RichTextElement[] = admin?.elements || defaultElements;
  const leaves: RichTextLeaf[] = admin?.leaves || defaultLeaves;

  const path = pathFromProps || name;

  const { i18n } = useTranslation();
  const [loaded, setLoaded] = useState(false);
  const [enabledElements, setEnabledElements] = useState({});
  const [enabledLeaves, setEnabledLeaves] = useState({});
  const editorRef = useRef(null);
  const toolbarRef = useRef(null);

  const drawerDepth = useEditDepth();
  const drawerIsOpen = drawerDepth > 1;

  const renderElement = useCallback(({ attributes, children, element }) => {
    const matchedElement = enabledElements[element?.type];
    const Element = matchedElement?.Element;

    if (Element) {
      return (
        <Element
          attributes={attributes}
          element={element}
          path={path}
          fieldProps={props}
          editorRef={editorRef}
        >
          {children}
        </Element>
      );
    }

    return <div {...attributes}>{children}</div>;
  }, [enabledElements, path, props]);

  const renderLeaf = useCallback(({ attributes, children, leaf }) => {
    const matchedLeaves = Object.entries(enabledLeaves).filter(([leafName]) => leaf[leafName]);

    if (matchedLeaves.length > 0) {
      return matchedLeaves.reduce((result, [leafName], i) => {
        if (enabledLeaves[leafName]?.Leaf) {
          const Leaf = enabledLeaves[leafName]?.Leaf;
          return (
            <Leaf
              key={i}
              leaf={leaf}
              path={path}
              fieldProps={props}
              editorRef={editorRef}
            >
              {result}
            </Leaf>
          );
        }

        return result;
      }, <span {...attributes}>{children}</span>);
    }

    return (
      <span {...attributes}>{children}</span>
    );
  }, [enabledLeaves, path, props]);

  const memoizedValidate = useCallback((value, validationOptions) => {
    return validate(value, { ...validationOptions, required });
  }, [validate, required]);

  const fieldType = useField({
    path,
    validate: memoizedValidate,
    condition,
  });

  const {
    value,
    showError,
    setValue,
    errorMessage,
    initialValue,
  } = fieldType;

  const classes = [
    baseClass,
    'field-type',
    className,
    showError && 'error',
    readOnly && `${baseClass}--read-only`,
    !hideGutter && `${baseClass}--gutter`,
  ].filter(Boolean).join(' ');

  const editor = useMemo(() => {
    let CreatedEditor = withEnterBreakOut(
      withHistory(
        withReact(
          createEditor(),
        ),
      ),
    );

    CreatedEditor = withHTML(CreatedEditor);

    CreatedEditor = enablePlugins(CreatedEditor, elements);
    CreatedEditor = enablePlugins(CreatedEditor, leaves);

    return CreatedEditor;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements, leaves, path]);

  // All slate changes fire the onChange event
  // including selection changes
  // so we will filter the set_selection operations out
  // and only fire setValue when onChange is because of value
  const handleChange = useCallback((val: unknown) => {
    const ops = editor.operations.filter((o: BaseOperation) => {
      if (o) {
        return o.type !== 'set_selection';
      }
      return false;
    });

    if (ops && Array.isArray(ops) && ops.length > 0) {
      if (!readOnly && val !== defaultValue && val !== value) {
        setValue(val);
      }
    }
  }, [editor.operations, readOnly, setValue, value]);

  useEffect(() => {
    if (!loaded) {
      const mergedElements = mergeCustomFunctions(elements, elementTypes);
      const mergedLeaves = mergeCustomFunctions(leaves, leafTypes);

      setEnabledElements(mergedElements);
      setEnabledLeaves(mergedLeaves);

      setLoaded(true);
    }
  }, [loaded, elements, leaves]);

  useEffect(() => {
    function setClickableState(clickState: 'disabled' | 'enabled') {
      const selectors = 'button, a, [role="button"]';
      const toolbarButtons: (HTMLButtonElement | HTMLAnchorElement)[] = toolbarRef.current?.querySelectorAll(selectors);

      (toolbarButtons || []).forEach((child) => {
        const isButton = child.tagName === 'BUTTON';
        const isDisabling = clickState === 'disabled';
        child.setAttribute('tabIndex', isDisabling ? '-1' : '0');
        if (isButton) child.setAttribute('disabled', isDisabling ? 'disabled' : null);
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
    } catch (err) {
      // do nothing
    }
  }

  if (!valueToRender) valueToRender = defaultValueFromProps || defaultValue;

  return (
    <div
      className={classes}
      style={{
        ...style,
        width,
      }}
    >
      <div className={`${baseClass}__wrap`}>
        <Error
          showError={showError}
          message={errorMessage}
        />
        <Label
          htmlFor={`field-${path.replace(/\./gi, '__')}`}
          label={label}
          required={required}
        />
        <Slate
          key={JSON.stringify({ initialValue, path })}
          editor={editor}
          value={valueToRender as any[]}
          onChange={handleChange}
        >
          <div className={`${baseClass}__wrapper`}>
            <div
              className={[
                `${baseClass}__toolbar`,
                drawerIsOpen && `${baseClass}__drawerIsOpen`,
              ].filter(Boolean).join(' ')}
              ref={toolbarRef}
            >
              <div className={`${baseClass}__toolbar-wrap`}>
                {elements.map((element, i) => {
                  let elementName: string;
                  if (typeof element === 'object' && element?.name) elementName = element.name;
                  if (typeof element === 'string') elementName = element;

                  const elementType = enabledElements[elementName];
                  const Button = elementType?.Button;

                  if (Button) {
                    return (
                      <Button
                        fieldProps={props}
                        key={i}
                        path={path}
                      />
                    );
                  }

                  return null;
                })}
                {leaves.map((leaf, i) => {
                  let leafName: string;
                  if (typeof leaf === 'object' && leaf?.name) leafName = leaf.name;
                  if (typeof leaf === 'string') leafName = leaf;

                  const leafType = enabledLeaves[leafName];
                  const Button = leafType?.Button;

                  if (Button) {
                    return (
                      <Button
                        fieldProps={props}
                        key={i}
                        path={path}
                      />
                    );
                  }

                  return null;
                })}
              </div>
            </div>
            <div
              className={`${baseClass}__editor`}
              ref={editorRef}
            >
              <Editable
                id={`field-${path.replace(/\./gi, '__')}`}
                className={`${baseClass}__input`}
                renderElement={renderElement}
                renderLeaf={renderLeaf}
                placeholder={getTranslation(placeholder, i18n)}
                spellCheck
                readOnly={readOnly}
                onKeyDown={(event) => {
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
                            Transforms.insertNodes(editor, { children: [{ text: '' }] });
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
                          match: (n) => SlateElement.isElement(n) && listTypes.includes(n.type),
                          split: true,
                          mode: 'lowest',
                        });

                        Transforms.setNodes(editor, { type: undefined });
                      }
                    } else if (editor.isVoid(selectedElement)) {
                      Transforms.removeNodes(editor);
                    }
                  }

                  Object.keys(hotkeys).forEach((hotkey) => {
                    if (isHotkey(hotkey, event as any)) {
                      event.preventDefault();
                      const mark = hotkeys[hotkey];
                      toggleLeaf(editor, mark);
                    }
                  });
                }}
              />
            </div>
          </div>
        </Slate>
        <FieldDescription
          value={value}
          description={description}
        />
      </div>
    </div>
  );
};
export default withCondition(RichText);
