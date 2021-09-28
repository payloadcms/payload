import { Editor, Element } from 'slate';

const isElementActive = (editor, format) => {
  const [match] = Editor.nodes(editor, {
    match: (n) => Element.isElement(n) && n.type === format,
  });

  return !!match;
};

export default isElementActive;
