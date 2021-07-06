import { Editor } from 'slate';

const isLeafActive = (editor, format) => {
  const leaves = Editor.marks(editor);
  return leaves ? leaves[format] === true : false;
};

export default isLeafActive;
