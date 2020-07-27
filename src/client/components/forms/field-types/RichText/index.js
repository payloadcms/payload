import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { createEditor } from 'slate';
import { withHistory } from 'slate-history';
import { Slate, withReact } from 'slate-react';
import {
  BlockquotePlugin,
  BoldPlugin,
  CodePlugin,
  CodeBlockPlugin,
  EditablePlugins,
  HeadingPlugin,
  ImagePlugin,
  ItalicPlugin,
  ListPlugin,
  ParagraphPlugin,
  pipe,
  SoftBreakPlugin,
  StrikethroughPlugin,
  UnderlinePlugin,
  withList,
  withToggleType,
} from '@udecode/slate-plugins';

import { nodeTypes } from './types';
import { richText } from '../../../../../fields/validations';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';
import CommandToolbar from './CommandToolbar';

import './index.scss';

const emptyRichTextNode = [{
  children: [{ text: '' }],
}];

const plugins = [
  BlockquotePlugin(),
  BoldPlugin(),
  CodePlugin({ hotkey: 'mod+shift+c' }),
  CodeBlockPlugin(),
  HeadingPlugin(),
  ImagePlugin(),
  ItalicPlugin(),
  ListPlugin(),
  ParagraphPlugin(),
  StrikethroughPlugin(),
  UnderlinePlugin(),
  SoftBreakPlugin({
    rules: [
      { hotkey: 'shift+enter' },
      {
        hotkey: 'enter',
        query: {
          allow: [nodeTypes.typeCodeBlock, nodeTypes.typeBlockquote],
        },
      },
    ],
  }),
];

const withPlugins = [
  withReact,
  withHistory,
  withList(nodeTypes),
  withToggleType({ defaultType: nodeTypes.typeP }),
];

const baseClass = 'rich-text';

const RichText = (props) => {
  const {
    path: pathFromProps,
    name,
    required,
    validate,
    label,
    placeholder,
    admin: {
      readOnly,
      style,
      width,
    } = {},
  } = props;

  const editor = useMemo(() => pipe(createEditor(), ...withPlugins), []);

  const path = pathFromProps || name;

  const fieldType = useFieldType({
    path,
    required,
    validate,
  });

  const {
    value,
    showError,
    setValue,
    errorMessage,
  } = fieldType;

  const [internalState, setInternalState] = useState(value);
  const [valueHasLoaded, setValueHasLoaded] = useState(false);

  useEffect(() => { setValue(internalState); }, [setValue, internalState]);

  useEffect(() => {
    // ! could use review
    if (value !== undefined && !valueHasLoaded) {
      setInternalState(value);
      setValueHasLoaded(true);
    }
  }, [value, valueHasLoaded]);

  const classes = [
    baseClass,
    'field-type',
    showError && 'error',
    readOnly && 'read-only',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      style={{
        ...style,
        width,
      }}
    >
      <Error
        showError={showError}
        message={errorMessage}
      />
      <Label
        htmlFor={path}
        label={label}
        required={required}
      />
      <div className={`${baseClass}__wrapper`}>
        <Slate
          editor={editor}
          value={internalState ?? emptyRichTextNode}
          onChange={(val) => setInternalState(val)}
        >
          <CommandToolbar enabledPluginList={plugins} />

          <EditablePlugins
            plugins={plugins}
            placeholder={placeholder}
            className={`${baseClass}__editor`}
          />
        </Slate>
      </div>
    </div>
  );
};

RichText.defaultProps = {
  label: null,
  required: false,
  placeholder: undefined,
  admin: {},
  validate: richText,
  path: '',
};

RichText.propTypes = {
  name: PropTypes.string.isRequired,
  path: PropTypes.string,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  validate: PropTypes.func,
  admin: PropTypes.shape({
    readOnly: PropTypes.bool,
    style: PropTypes.shape({}),
    width: PropTypes.string,
  }),
  label: PropTypes.string,
};

export default RichText;
