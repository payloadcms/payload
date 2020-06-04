import { Transforms, Editor, Text } from 'slate';
import isHotKey from 'is-hotkey';

// Check keystroke command
export const KEYSTROKE_COMMANDS = {
  bold: isHotKey('mod+b'),
  code: isHotKey('mod+shift+c'),
  italic: isHotKey('mod+i'),
  underline: isHotKey('mod+u'),
};

// Editor Checks
const editorCheck = {
  isBoldMarkActive(editor) {
    const [match] = Editor.nodes(editor, {
      match: node => node.bold === true,
      universal: true,
    });

    return !!match;
  },

  isItalicMarkActive(editor) {
    const [match] = Editor.nodes(editor, {
      match: node => node.italic === true,
      universal: true,
    });

    return !!match;
  },

  isUnderlineMarkActive(editor) {
    const [match] = Editor.nodes(editor, {
      match: node => node.underline === true,
      universal: true,
    });

    return !!match;
  },

  isCodeBlockActive(editor) {
    const [match] = Editor.nodes(editor, {
      match: node => node.type === 'code',
    });

    return !!match;
  },
};

// Editor Commands
export const editorCommands = {
  // Inline Marks
  toggleBoldMark(editor) {
    const isActive = editorCheck.isBoldMarkActive(editor);

    Transforms.setNodes(
      editor,
      { bold: isActive ? null : true },
      { match: node => Text.isText(node), split: true },
    );
  },

  toggleItalicMark(editor) {
    const isActive = editorCheck.isItalicMarkActive(editor);

    Transforms.setNodes(
      editor,
      { italic: isActive ? null : true },
      { match: node => Text.isText(node), split: true },
    );
  },

  toggleUnderlineMark(editor) {
    const isActive = editorCheck.isUnderlineMarkActive(editor);

    Transforms.setNodes(
      editor,
      { underline: isActive ? null : true },
      { match: node => Text.isText(node), split: true },
    );
  },

  // Blocks
  toggleCodeBlock(editor) {
    const isActive = editorCheck.isCodeBlockActive(editor);

    Transforms.setNodes(
      editor,
      { type: isActive ? null : 'code' },
      { match: node => Editor.isBlock(editor, node) },
    );
  },
};
