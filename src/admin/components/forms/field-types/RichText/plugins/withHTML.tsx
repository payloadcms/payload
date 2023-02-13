import { Transforms } from 'slate';
import { jsx } from 'slate-hyperscript';

const ELEMENT_TAGS = {
  A: (el) => ({ type: 'link', newTab: el.getAttribute('target') === '_blank', url: el.getAttribute('href') }),
  BLOCKQUOTE: () => ({ type: 'blockquote' }),
  H1: () => ({ type: 'h1' }),
  H2: () => ({ type: 'h2' }),
  H3: () => ({ type: 'h3' }),
  H4: () => ({ type: 'h4' }),
  H5: () => ({ type: 'h5' }),
  H6: () => ({ type: 'h6' }),
  LI: () => ({ type: 'li' }),
  OL: () => ({ type: 'ol' }),
  P: () => ({}),
  PRE: () => ({ type: 'code' }),
  UL: () => ({ type: 'ul' }),
};

const TEXT_TAGS = {
  CODE: () => ({ code: true }),
  DEL: () => ({ strikethrough: true }),
  EM: () => ({ italic: true }),
  I: () => ({ italic: true }),
  S: () => ({ strikethrough: true }),
  STRONG: () => ({ bold: true }),
  U: () => ({ underline: true }),
};

const deserialize = (el) => {
  if (el.nodeType === 3) {
    return el.textContent;
  } if (el.nodeType !== 1) {
    return null;
  } if (el.nodeName === 'BR') {
    return '\n';
  }

  const { nodeName } = el;
  let parent = el;

  if (
    nodeName === 'PRE'
    && el.childNodes[0]
    && el.childNodes[0].nodeName === 'CODE'
  ) {
    [parent] = el.childNodes;
  }

  let children = Array.from(parent.childNodes)
    .map(deserialize)
    .flat();

  if (children.length === 0) {
    children = [{ text: '' }];
  }

  if (el.nodeName === 'BODY') {
    return jsx('fragment', {}, children);
  }

  if (ELEMENT_TAGS[nodeName]) {
    const attrs = ELEMENT_TAGS[nodeName](el);
    return jsx('element', attrs, children);
  }

  if (TEXT_TAGS[nodeName]) {
    const attrs = TEXT_TAGS[nodeName](el);
    return children.map((child) => jsx('text', attrs, child));
  }

  return children;
};

const withHTML = (incomingEditor) => {
  const { insertData } = incomingEditor;

  const editor = incomingEditor;

  editor.insertData = (data) => {
    if (!data.types.includes('application/x-slate-fragment')) {
      const html = data.getData('text/html');

      if (html) {
        const parsed = new DOMParser().parseFromString(html, 'text/html');
        const fragment = deserialize(parsed.body);
        Transforms.insertFragment(editor, fragment);
        return;
      }
    }

    insertData(data);
  };

  return editor;
};

export default withHTML;
