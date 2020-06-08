import React, { useMemo, useState } from 'react';
import { createEditor } from 'slate';
import { withHistory } from 'slate-history';
import { Slate, withReact } from 'slate-react';
import {
  ParagraphPlugin,
  BoldPlugin,
  EditablePlugins,
  ItalicPlugin,
  UnderlinePlugin,
  pipe,
  getRenderElement,
} from '@udecode/slate-plugins';

import ImageElement from '../RichTextCustom/Elements/Blockquote';

const initialValue = [
  {
    children: [
      { text: 'This is editable plain text, just like a <textarea>!' },
    ],
  },
];

export const renderLeafItalic = () => ({ children, leaf }) => {
  if (leaf.MARK_ITALIC) {
    return (
      <em>
        FUCK:
        {' '}
        {children}
      </em>
    );
  }

  return children;
};

const plugins = [ParagraphPlugin(), BoldPlugin(), UnderlinePlugin(), renderLeafItalic()];

const withPlugins = [withReact, withHistory];

const RichText = () => {
  const [value, setValue] = useState(initialValue);

  const editor = useMemo(() => pipe(createEditor(), ...withPlugins), []);

  return (
    <Slate
      editor={editor}
      value={value}
      onChange={newValue => setValue(newValue)}
    >
      <EditablePlugins
        plugins={plugins}
        placeholder="Enter some text..."
      />
    </Slate>
  );
};


export default RichText;
