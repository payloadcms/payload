import React from 'react';
import { useSlate } from 'slate-react';

import RichTextButton from './CommandButton';
import { editorCheck, editorCommands } from '../utils';

import './index.scss';

const baseClass = 'commands-toolbar';

const CommandsToolbar = (props) => {
  const { className } = props;
  const editor = useSlate();

  const classes = [
    baseClass,
    className && className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <RichTextButton
        isActive={editorCheck.isH1Active(editor)}
        onClick={() => editorCommands.toggleH1Block(editor)}
      >
        H1
      </RichTextButton>
      <RichTextButton
        isActive={editorCheck.isH2Active(editor)}
        onClick={() => editorCommands.toggleH2Block(editor)}
      >
        H2
      </RichTextButton>
      <RichTextButton
        isActive={editorCheck.isH3Active(editor)}
        onClick={() => editorCommands.toggleH3Block(editor)}
      >
        H3
      </RichTextButton>
      <RichTextButton
        isActive={editorCheck.isH4Active(editor)}
        onClick={() => editorCommands.toggleH4Block(editor)}
      >
        H4
      </RichTextButton>
      <RichTextButton
        isActive={editorCheck.isH5Active(editor)}
        onClick={() => editorCommands.toggleH5Block(editor)}
      >
        H5
      </RichTextButton>
      <RichTextButton
        isActive={editorCheck.isH6Active(editor)}
        onClick={() => editorCommands.toggleH6Block(editor)}
      >
        H6
      </RichTextButton>

      <RichTextButton
        isActive={editorCheck.isBoldActive(editor)}
        onClick={() => editorCommands.toggleBoldMark(editor)}
      >
        Bold
      </RichTextButton>
      <RichTextButton
        isActive={editorCheck.isItalicActive(editor)}
        onClick={() => editorCommands.toggleItalicMark(editor)}
      >
        Italic
      </RichTextButton>
      <RichTextButton
        isActive={editorCheck.isUnderlineActive(editor)}
        onClick={() => editorCommands.toggleUnderlineMark(editor)}
      >
        Underline
      </RichTextButton>
      <RichTextButton
        isActive={editorCheck.isStrikethroughActive(editor)}
        onClick={() => editorCommands.toggleStrikethroughMark(editor)}
      >
        Strikethrough
      </RichTextButton>
      <RichTextButton
        isActive={editorCheck.isBlockquoteActive(editor)}
        onClick={() => editorCommands.toggleBlockquoteBlock(editor)}
      >
        Blockquote
      </RichTextButton>
      <RichTextButton
        isActive={editorCheck.isCodeActive(editor)}
        onClick={() => editorCommands.toggleCodeMark(editor)}
      >
        Code
      </RichTextButton>
    </div>
  );
};

export default CommandsToolbar;
