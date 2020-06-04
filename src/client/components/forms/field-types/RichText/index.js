import React, { useCallback, useMemo, useState } from 'react';
import { createEditor } from 'slate';
import { withHistory } from 'slate-history';
import { Slate, Editable, withReact } from 'slate-react';

import InlineMark from './InlineMark';
import { DefaultElement, CodeElement } from './Blocks';
import { KEYSTROKE_COMMANDS, editorCommands } from './customCommands';

const RichText = () => {
  const editor = useMemo(() => withReact(withHistory(createEditor())), []);

  const [value, setValue] = useState([
    {
      type: 'paragraph',
      children: [{ text: 'A line of text in a paragraph.' }],
    },
  ]);

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
      onChange={newValue => setValue(newValue)}
    >
      <Editable
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        onKeyDown={(event) => {
          if (!event.metaKey) return;

          if (KEYSTROKE_COMMANDS.code(event)) {
            event.preventDefault();
            editorCommands.toggleCodeBlock(editor);
          }

          if (KEYSTROKE_COMMANDS.bold(event)) {
            event.preventDefault();
            editorCommands.toggleBoldMark(editor);
          }

          if (KEYSTROKE_COMMANDS.italic(event)) {
            event.preventDefault();
            editorCommands.toggleItalicMark(editor);
          }

          if (KEYSTROKE_COMMANDS.underline(event)) {
            event.preventDefault();
            editorCommands.toggleUnderlineMark(editor);
          }
        }}
      />
    </Slate>
  );
};

export default RichText;
