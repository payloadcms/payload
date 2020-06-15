// need to determine if current selection is within a blockquote
// if it is, is it empty?
// if its empty, is the key the delete key?
// if the key === delete, toggle the element type off
// if the key combo === 'mod+alt' insert soft break

// use editor, to get current selection and type

import { Editor } from 'slate';
import {
  isNodeInSelection, isBlockTextEmpty, getTextFromBlockStartToAnchor,
} from '@udecode/slate-plugins';

const onKeyDown = (e, options) => {
  const { editor } = options;
  const isInsideBlockquote = isNodeInSelection(editor, 'blockquote');
  const currentKey = e.key;

  // check to see if we are in a blockquote
  if (!isInsideBlockquote) return null;
  const selectionText = getTextFromBlockStartToAnchor(editor);
  console.log(selectionText);
  // check to see if there is text inside the blockquote
  // const blockTextIsEmpty = isBlockTextEmpty(match);
  // console.log(blockTextIsEmpty);
  // if (blockTextIsEmpty) return null;
  // return 'test';
};

export default onKeyDown;
