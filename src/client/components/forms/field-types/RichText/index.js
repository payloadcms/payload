import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { createEditor } from 'slate';
import { withHistory } from 'slate-history';
import { Slate, withReact } from 'slate-react';
import {
  BlockquotePlugin,
  BoldPlugin,
  CodePlugin,
  EditablePlugins,
  HeadingPlugin,
  ImagePlugin,
  ItalicPlugin,
  ListPlugin,
  ParagraphPlugin,
  pipe,
  StrikethroughPlugin,
  UnderlinePlugin,
  withList,
  withToggleType,
} from '@udecode/slate-plugins';

import { richText } from '../../../../../fields/validations';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';
import CommandToolbar from './CommandToolbar';

import './index.scss';

const emptyRichTextNode = [{
  children: [{ text: '' }],
}];

const enabledPluginList = {
  blockquote: options => BlockquotePlugin(options),
  bold: options => BoldPlugin(options),
  code: options => CodePlugin(options),
  heading: options => HeadingPlugin(options),
  image: options => ImagePlugin(options),
  italic: options => ItalicPlugin(options),
  list: options => ListPlugin(options),
  paragraph: options => ParagraphPlugin(options),
  strikethrough: options => StrikethroughPlugin(options),
  underline: options => UnderlinePlugin(options),
};

const enabledPluginFunctions = [];
const withPlugins = [withReact, withHistory];

const baseClass = 'rich-text';

const RichText = (props) => {
  const {
    path: pathFromProps,
    name,
    required,
    defaultValue,
    initialData,
    validate,
    style,
    width,
    label,
    placeholder,
    readOnly,
    disabledPlugins,
    disabledMarks,
    maxHeadingLevel,
  } = props;

  useEffect(() => {
    // remove config disabled plugins
    if (disabledPlugins.length > 0) {
      disabledPlugins.forEach((pluginKey) => {
        delete enabledPluginList[pluginKey];
      });
    }

    // push the rest to enabledPlugins
    Object.keys(enabledPluginList).forEach((plugin) => {
      const options = {};
      if (plugin === 'heading' && maxHeadingLevel < 6) {
        options.levels = maxHeadingLevel;
      }

      enabledPluginFunctions.push(enabledPluginList[plugin](options));
    });
  }, [disabledPlugins, maxHeadingLevel]);

  const path = pathFromProps || name;

  const fieldType = useFieldType({
    path,
    required,
    initialData,
    defaultValue,
    validate,
  });

  const {
    value,
    showError,
    setValue,
    errorMessage,
  } = fieldType;

  const editor = useMemo(() => pipe(createEditor(), ...withPlugins, withToggleType(), withList()), []);

  const [internalState, setInternalState] = useState(value);
  const [valueHasLoaded, setValueHasLoaded] = useState(false);

  useEffect(() => { setValue(internalState); }, [setValue, internalState]);

  useEffect(() => {
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
          onChange={val => setInternalState(val)}
        >
          <CommandToolbar
            enabledPluginList={enabledPluginList}
            disabledMarks={disabledMarks}
            maxHeadingLevel={maxHeadingLevel}
          />

          <EditablePlugins
            plugins={enabledPluginFunctions}
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
  readOnly: false,
  defaultValue: undefined,
  initialData: undefined,
  placeholder: undefined,
  width: undefined,
  style: {},
  validate: richText,
  path: '',
  disabledPlugins: [],
  disabledMarks: [],
  maxHeadingLevel: 6,
};

RichText.propTypes = {
  name: PropTypes.string.isRequired,
  path: PropTypes.string,
  required: PropTypes.bool,
  readOnly: PropTypes.bool,
  placeholder: PropTypes.string,
  defaultValue: PropTypes.string,
  initialData: PropTypes.arrayOf(PropTypes.shape({})),
  validate: PropTypes.func,
  width: PropTypes.string,
  style: PropTypes.shape({}),
  label: PropTypes.string,
  disabledPlugins: PropTypes.arrayOf(PropTypes.string),
  disabledMarks: PropTypes.arrayOf(PropTypes.string),
  maxHeadingLevel: PropTypes.number,
};

export default RichText;
