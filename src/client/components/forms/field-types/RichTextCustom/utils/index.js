import { Transforms, Editor, Text } from 'slate';
import isHotKey from 'is-hotkey';


/* --_--_--_--_--_--_--
Keypress Commands
--_--_--_--_--_--_-- */
export const KEYPRESS_COMMANDS = {
  mod: isHotKey('mod'),
  bold: isHotKey('mod+b'),
  code: isHotKey('mod+shift+c'),
  italic: isHotKey('mod+i'),
  underline: isHotKey('mod+u'),
  strikethrough: isHotKey('mod+s'),
  blockquote: isHotKey('mod+shift+9'),
};


/* --_--_--_--_--_--_--
Editor Checks
--_--_--_--_--_--_-- */
export const editorCheck = {

  // Inline Checks
  isBoldActive(editor) {
    const [match] = Editor.nodes(editor, {
      match: node => node.bold === true,
    });

    return !!match;
  },

  isItalicActive(editor) {
    const [match] = Editor.nodes(editor, {
      match: node => node.italic === true,
    });

    return !!match;
  },

  isUnderlineActive(editor) {
    const [match] = Editor.nodes(editor, {
      match: node => node.underline === true,
    });

    return !!match;
  },

  isStrikethroughActive(editor) {
    const [match] = Editor.nodes(editor, {
      match: node => node.strikethrough === true,
    });

    return !!match;
  },

  isCodeActive(editor) {
    const [match] = Editor.nodes(editor, {
      match: node => node.code === true,
    });

    return !!match;
  },


  // Block Checks
  isBlockquoteActive(editor) {
    const [match] = Editor.nodes(editor, {
      match: node => node.type === 'blockquote',
    });

    return !!match;
  },

  isH1Active(editor) {
    const [match] = Editor.nodes(editor, {
      match: node => node.type === 'h1',
    });

    return !!match;
  },

  isH2Active(editor) {
    const [match] = Editor.nodes(editor, {
      match: node => node.type === 'h2',
    });

    return !!match;
  },

  isH3Active(editor) {
    const [match] = Editor.nodes(editor, {
      match: node => node.type === 'h3',
    });

    return !!match;
  },

  isH4Active(editor) {
    const [match] = Editor.nodes(editor, {
      match: node => node.type === 'h4',
    });

    return !!match;
  },

  isH5Active(editor) {
    const [match] = Editor.nodes(editor, {
      match: node => node.type === 'h5',
    });

    return !!match;
  },

  isH6Active(editor) {
    const [match] = Editor.nodes(editor, {
      match: node => node.type === 'h6',
    });

    return !!match;
  },
};


//! only apply styles to cursor or selection

/* --_--_--_--_--_--_--
Editor Commands
--_--_--_--_--_--_-- */
export const editorCommands = {

  // Inline Marks/Leafs
  toggleBoldMark(editor) {
    const boldIsActive = !!editorCheck.isBoldActive(editor);
    console.log('boldIsActive', boldIsActive);

    Transforms.setNodes(
      editor,
      { bold: boldIsActive ? null : true },
      {
        match: node => Text.isText(node),
        split: true,
      },
    );
  },

  toggleItalicMark(editor) {
    const italicIsActive = editorCheck.isItalicActive(editor);

    Transforms.setNodes(
      editor,
      { italic: italicIsActive ? null : true },
      {
        match: node => Text.isText(node),
        split: true,
      },
    );
  },

  toggleUnderlineMark(editor) {
    const underlineIsActive = editorCheck.isUnderlineActive(editor);

    Transforms.setNodes(
      editor,
      {
        underline: underlineIsActive ? null : true,
        strikethrough: false,
      },
      {
        match: node => Text.isText(node),
        split: true,
      },
    );
  },

  toggleStrikethroughMark(editor) {
    const strikethroughIsActive = editorCheck.isStrikethroughActive(editor);

    Transforms.setNodes(
      editor,
      {
        strikethrough: strikethroughIsActive ? null : true,
        underline: false,
      },
      {
        match: node => Text.isText(node),
        split: true,
      },
    );
  },

  toggleCodeMark(editor) {
    const codeMarkIsActive = editorCheck.isCodeActive(editor);

    Transforms.setNodes(
      editor,
      { code: codeMarkIsActive ? null : true },
      {
        match: node => Text.isText(node),
        split: true,
      },
    );
  },


  // Toggle Blocks
  toggleBlockquoteBlock(editor) {
    const blockQuoteActive = editorCheck.isBlockquoteActive(editor);

    Transforms.setNodes(
      editor,
      { type: blockQuoteActive ? null : 'blockquote' },
      { match: node => Editor.isBlock(editor, node) },
    );
  },

  toggleH1Block(editor) {
    const h1IsActive = editorCheck.isH1Active(editor);

    Transforms.setNodes(
      editor,
      { type: h1IsActive ? null : 'h1' },
      { match: node => Editor.isBlock(editor, node) },
    );
  },

  toggleH2Block(editor) {
    const isActive = editorCheck.isH2Active(editor);

    Transforms.setNodes(
      editor,
      { type: isActive ? null : 'h2' },
      { match: node => Editor.isBlock(editor, node) },
    );
  },

  toggleH3Block(editor) {
    const h3IsActive = editorCheck.isH3Active(editor);

    Transforms.setNodes(
      editor,
      { type: h3IsActive ? null : 'h3' },
      { match: node => Editor.isBlock(editor, node) },
    );
  },

  toggleH4Block(editor) {
    const h4IsActive = editorCheck.isH4Active(editor);

    Transforms.setNodes(
      editor,
      { type: h4IsActive ? null : 'h4' },
      { match: node => Editor.isBlock(editor, node) },
    );
  },

  toggleH5Block(editor) {
    const h5IsActive = editorCheck.isH5Active(editor);

    Transforms.setNodes(
      editor,
      { type: h5IsActive ? null : 'h5' },
      { match: node => Editor.isBlock(editor, node) },
    );
  },

  toggleH6Block(editor) {
    const h6IsActive = editorCheck.isH6Active(editor);

    Transforms.setNodes(
      editor,
      { type: h6IsActive ? null : 'h6' },
      { match: node => Editor.isBlock(editor, node) },
    );
  },

};
