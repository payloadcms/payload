import React, { useCallback, useMemo, useState } from 'react';
import { createEditor } from 'slate';
import { withHistory } from 'slate-history';
import { Slate, Editable, withReact } from 'slate-react';

import CommandsToolbar from './CommandsToolbar';
import { KEYPRESS_COMMANDS, editorCommands } from './utils';
import elements from './Elements';
import Leaf from './Leaf';

import './index.scss';

const baseClass = 'rich-text-editor';

const emptyNode = [{
  type: 'paragraph',
  children: [{ text: '' }],
}];

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
  } = props;

  const editor = useMemo(() => withReact(withHistory(createEditor())), []);

  //! only for ease of testing
  const storedData = JSON.parse(localStorage.getItem('rich-text-content'));
  const intialEditorContent = storedData || emptyNode;

  const [value, setValue] = useState(intialEditorContent);

  // const fieldType = useFieldType({
  //   path,
  //   required,
  //   initialData,
  //   defaultValue,
  //   validate,
  // });

  const renderBlockElement = useCallback((elementProps) => {
    const {
      element: {
        type,
      },
      attributes,
      children,
    } = elementProps;

    const ElementToRender = elements[type];

    if (ElementToRender) return <ElementToRender attributes={attributes}>{children}</ElementToRender>;

    return <p {...attributes}>{children}</p>;
  }, []);

  const renderLeaf = useCallback((elementProps) => {
    return <Leaf {...elementProps} />;
  }, []);

  const classes = [baseClass].filter(Boolean).join(' ');

  return (
    <Slate
      editor={editor}
      value={value}
      onChange={(newValue) => {
        setValue(newValue);

        //! only for ease of testing
        localStorage.setItem('rich-text-content', JSON.stringify(newValue));
      }}
    >
      <div className={classes}>
        <CommandsToolbar />

        <Editable
          className={`${baseClass}__editable-content-container`}
          renderElement={renderBlockElement}
          renderLeaf={renderLeaf}
          onKeyDown={(event) => {
            if (!event.metaKey) return;

            if (KEYPRESS_COMMANDS.code(event)) {
              event.preventDefault();
              editorCommands.toggleCodeMark(editor);
            }

            if (KEYPRESS_COMMANDS.bold(event)) {
              event.preventDefault();
              editorCommands.toggleBoldMark(editor);
            }

            if (KEYPRESS_COMMANDS.italic(event)) {
              event.preventDefault();
              editorCommands.toggleItalicMark(editor);
            }

            if (KEYPRESS_COMMANDS.underline(event)) {
              event.preventDefault();
              editorCommands.toggleUnderlineMark(editor);
            }

            if (KEYPRESS_COMMANDS.strikethrough(event)) {
              event.preventDefault();
              editorCommands.toggleStrikethroughMark(editor);
            }

            if (KEYPRESS_COMMANDS.blockquote(event)) {
              event.preventDefault();
              editorCommands.toggleBlockquoteBlock(editor);
            }
          }}
        />
      </div>
    </Slate>
  );
};

export default RichText;
