import React, { useCallback, useMemo, useState } from 'react';
import { createEditor } from 'slate';
import { withHistory } from 'slate-history';
import { Slate, Editable, withReact } from 'slate-react';

import InlineMark from './InlineMark';
import { DefaultElement, CodeElement } from './Blocks';
import { KEYPRESS_COMMANDS, editorCommands } from './customCommands';

const emptyNode = [{
  type: 'paragraph',
  children: [{ text: '' }],
}];

const RichText = () => {
  const editor = useMemo(() => withReact(withHistory(createEditor())), []);

  const storedData = JSON.parse(localStorage.getItem('rich-text-content'));
  const intialEditorContent = storedData || emptyNode;

  const [value, setValue] = useState(intialEditorContent);

  const renderElement = useCallback((elementProps) => {
    const { element } = elementProps;

    switch (element.type) {
      case 'code':
        return <CodeElement {...elementProps} />;
      default:
        return <DefaultElement {...elementProps} />;
    }
  }, []);

  const renderLeaf = useCallback((elementProps) => {
    return <InlineMark {...elementProps} />;
  }, []);

  return (
    <Slate
      editor={editor}
      value={value}
      onChange={(newValue) => {
        setValue(newValue);

        // Save the value to Local Storage for testing
        localStorage.setItem('rich-text-content', JSON.stringify(newValue));
      }}
    >
      <Editable
        renderElement={renderElement}
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
        }}
      />
    </Slate>
  );
};

export default RichText;
