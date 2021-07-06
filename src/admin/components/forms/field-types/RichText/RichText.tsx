import React, { useState, useCallback, useMemo, useEffect } from 'react';
import isHotkey from 'is-hotkey';
import { Editable, withReact, Slate } from 'slate-react';
import { createEditor, Transforms } from 'slate';
import { withHistory } from 'slate-history';
import { richText } from '../../../../../fields/validations';
import useFieldType from '../../useFieldType';
import withCondition from '../../withCondition';
import Label from '../../Label';
import Error from '../../Error';
import leafTypes from './leaves';
import elementTypes from './elements';
import toggleLeaf from './leaves/toggle';
import hotkeys from './hotkeys';
import enablePlugins from './enablePlugins';
import defaultValue from '../../../../../fields/richText/defaultValue';
import FieldTypeGutter from '../../FieldTypeGutter';
import withHTML from './plugins/withHTML';
import { Props } from './types';
import { RichTextElement, RichTextLeaf } from '../../../../../fields/config/types';

import mergeCustomFunctions from './mergeCustomFunctions';

import './index.scss';

const defaultElements: RichTextElement[] = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'link', 'relationship'];
const defaultLeaves: RichTextLeaf[] = ['bold', 'italic', 'underline', 'strikethrough', 'code'];

const baseClass = 'rich-text';

const RichText: React.FC<Props> = (props) => {
  const {
    path: pathFromProps,
    name,
    required,
    validate = richText,
    label,
    admin,
    admin: {
      readOnly,
      style,
      width,
      placeholder,
      condition,
      hideGutter,
    } = {},
  } = props;

  const elements: RichTextElement[] = admin?.elements || defaultElements;
  const leaves: RichTextLeaf[] = admin?.leaves || defaultLeaves;

  const path = pathFromProps || name;

  const [loaded, setLoaded] = useState(false);
  const [enabledElements, setEnabledElements] = useState({});
  const [enabledLeaves, setEnabledLeaves] = useState({});

  const renderElement = useCallback(({ attributes, children, element }) => {
    const matchedElement = enabledElements[element?.type];
    const Element = matchedElement?.Element;

    if (Element) {
      return (
        <Element
          attributes={attributes}
          element={element}
        >
          {children}
        </Element>
      );
    }

    return <div {...attributes}>{children}</div>;
  }, [enabledElements]);

  const renderLeaf = useCallback(({ attributes, children, leaf }) => {
    const matchedLeafName = Object.keys(enabledLeaves).find((leafName) => leaf[leafName]);

    if (enabledLeaves[matchedLeafName]?.Leaf) {
      const { Leaf } = enabledLeaves[matchedLeafName];

      return (
        <Leaf
          attributes={attributes}
          leaf={leaf}
        >
          {children}
        </Leaf>
      );
    }

    return (
      <span {...attributes}>{children}</span>
    );
  }, [enabledLeaves]);

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { required });
    return validationResult;
  }, [validate, required]);

  const fieldType = useFieldType({
    path,
    validate: memoizedValidate,
    stringify: true,
    condition,
  });

  const {
    value,
    showError,
    setValue,
    errorMessage,
  } = fieldType;

  const classes = [
    baseClass,
    'field-type',
    showError && 'error',
    readOnly && `${baseClass}--read-only`,
  ].filter(Boolean).join(' ');

  const editor = useMemo(() => {
    let CreatedEditor = withHTML(
      withHistory(
        withReact(
          createEditor(),
        ),
      ),
    );

    CreatedEditor = enablePlugins(CreatedEditor, elements);
    CreatedEditor = enablePlugins(CreatedEditor, leaves);

    return CreatedEditor;
  }, [elements, leaves]);

  const onBlur = useCallback(() => {
    editor.blurSelection = editor.selection;
  }, [editor]);

  useEffect(() => {
    if (!loaded) {
      const mergedElements = mergeCustomFunctions(elements, elementTypes);
      const mergedLeaves = mergeCustomFunctions(leaves, leafTypes);

      setEnabledElements(mergedElements);
      setEnabledLeaves(mergedLeaves);

      setLoaded(true);
    }
  }, [loaded, elements, leaves]);

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

  if (!valueToRender) valueToRender = defaultValue;

  return (
    <div
      className={classes}
      style={{
        ...style,
        width,
      }}
    >
      { !hideGutter && (<FieldTypeGutter />) }
      <div className={`${baseClass}__wrap`}>
        <Error
          showError={showError}
          message={errorMessage}
        />
        <Label
          htmlFor={path}
          label={label}
          required={required}
        />
        <Slate
          editor={editor}
          value={valueToRender as any[]}
          onChange={(val) => {
            if (val !== defaultValue && val !== value) {
              setValue(val);
            }
          }}
        >
          <div className={`${baseClass}__wrapper`}>
            <div className={`${baseClass}__toolbar`}>
              {elements.map((element, i) => {
                let elementName: string;
                if (typeof element === 'object' && element?.name) elementName = element.name;
                if (typeof element === 'string') elementName = element;

                const elementType = enabledElements[elementName];
                const Button = elementType?.Button;

                if (Button) {
                  return (
                    <Button
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
                      key={i}
                      path={path}
                    />
                  );
                }

                return null;
              })}
            </div>
            <Editable
              className={`${baseClass}__editor`}
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              placeholder={placeholder}
              spellCheck
              readOnly={readOnly}
              onBlur={onBlur}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  if (event.shiftKey) {
                    event.preventDefault();
                    editor.insertText('\n');
                  } else {
                    setTimeout(() => {
                      Transforms.setNodes(editor, { type: 'p' });
                    }, 0);
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
        </Slate>
      </div>
    </div>
  );
};
export default withCondition(RichText);
