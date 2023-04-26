import * as React from 'react';
import { ReactEditor, useSlate } from 'slate-react';
import RichTextButton from '../../../../../../src/admin/components/forms/field-types/RichText/elements/Button';
import { injectVoidElement } from '../../../../../../src/admin/components/forms/field-types/RichText/elements/injectVoid';

import { elementIdentifier } from '.';

const insertMarkdown = (editor) => {
  const markdownElement = {
    type: elementIdentifier,
    children: [
      { text: ' ' },
    ],
  };

  injectVoidElement(editor, markdownElement);

  ReactEditor.focus(editor);
};

const Icon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="100%"
      viewBox="0 0 208 128"
      style={{
        width: 'auto',
      }}
      stroke="currentColor"
    >
      <rect
        width="198"
        height="118"
        x="5"
        y="5"
        ry="10"
        strokeWidth="10"
        fill="none"
      />
      <path
        d="M30 98V30h20l20 25 20-25h20v68H90V59L70 84 50 59v39zm125 0l-30-33h20V30h20v35h20z"
        fill="currentColor"
      />
    </svg>
  );
};

export const Button: React.FC = () => {
  const editor = useSlate();

  const onClick = () => {
    insertMarkdown(editor);
  };

  return (
    <RichTextButton
      onClick={onClick}
      format={elementIdentifier}
    >
      <Icon />
    </RichTextButton>
  );
};
