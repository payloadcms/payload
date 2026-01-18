import { describe, it, expect } from 'vitest';
import { convertLexicalToPlaintext } from './sync/index.js';
function textNode(text, bold) {
  return {
    type: 'text',
    detail: 0,
    format: bold ? 1 : 0,
    mode: 'normal',
    style: '',
    text,
    version: 1
  };
}
function linebreakNode() {
  return {
    type: 'linebreak',
    version: 1
  };
}
function tabNode() {
  return {
    type: 'tab',
    detail: 0,
    format: 0,
    mode: 'normal',
    style: '',
    text: '',
    version: 1
  };
}
function paragraphNode(children) {
  return {
    type: 'paragraph',
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    textFormat: 0,
    version: 1
  };
}
function headingNode(children) {
  return {
    type: 'heading',
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    textFormat: 0,
    tag: 'h1',
    version: 1
  };
}
function listItemNode(children) {
  return {
    type: 'listitem',
    children,
    checked: false,
    direction: 'ltr',
    format: '',
    indent: 0,
    value: 0,
    version: 1
  };
}
function listNode(children) {
  return {
    type: 'list',
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    listType: 'bullet',
    start: 0,
    tag: 'ul',
    version: 1
  };
}
function tableNode(children) {
  return {
    type: 'table',
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1
  };
}
function tableRowNode(children) {
  return {
    type: 'tablerow',
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1
  };
}
function tableCellNode(children) {
  return {
    type: 'tablecell',
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    headerState: 0,
    version: 1
  };
}
function rootNode(nodes) {
  return {
    root: {
      type: 'root',
      children: nodes,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1
    }
  };
}
describe('convertLexicalToPlaintext', () => {
  it('ensure paragraph with text is correctly converted', () => {
    const data = rootNode([paragraphNode([textNode('Basic Text')])]);
    const plaintext = convertLexicalToPlaintext({
      data
    });
    expect(plaintext).toBe('Basic Text');
  });
  it('ensure paragraph with multiple text nodes is correctly converted', () => {
    const data = rootNode([paragraphNode([textNode('Basic Text'), textNode(' Bold', true), textNode(' Text')])]);
    const plaintext = convertLexicalToPlaintext({
      data
    });
    expect(plaintext).toBe('Basic Text Bold Text');
  });
  it('ensure linebreaks are converted correctly', () => {
    const data = rootNode([paragraphNode([textNode('Basic Text'), linebreakNode(), textNode('Next Line')])]);
    const plaintext = convertLexicalToPlaintext({
      data
    });
    expect(plaintext).toBe('Basic Text\nNext Line');
  });
  it('ensure tabs are converted correctly', () => {
    const data = rootNode([paragraphNode([textNode('Basic Text'), tabNode(), textNode('Next Line')])]);
    const plaintext = convertLexicalToPlaintext({
      data
    });
    expect(plaintext).toBe('Basic Text\tNext Line');
  });
  it('ensure new lines are added between paragraphs', () => {
    const data = rootNode([paragraphNode([textNode('Basic text')]), paragraphNode([textNode('Next block-node')])]);
    const plaintext = convertLexicalToPlaintext({
      data
    });
    expect(plaintext).toBe('Basic text\n\nNext block-node');
  });
  it('ensure new lines are added between heading nodes', () => {
    const data = rootNode([headingNode([textNode('Basic text')]), headingNode([textNode('Next block-node')])]);
    const plaintext = convertLexicalToPlaintext({
      data
    });
    expect(plaintext).toBe('Basic text\n\nNext block-node');
  });
  it('ensure new lines are added between list items and lists', () => {
    const data = rootNode([listNode([listItemNode([textNode('First item')]), listItemNode([textNode('Second item')])]), listNode([listItemNode([textNode('Next list')])])]);
    const plaintext = convertLexicalToPlaintext({
      data
    });
    expect(plaintext).toBe('First item\nSecond item\n\nNext list');
  });
  it('ensure new lines are added between tables, table rows, and table cells', () => {
    const data = rootNode([tableNode([tableRowNode([tableCellNode([textNode('Cell 1, Row 1')]), tableCellNode([textNode('Cell 2, Row 1')])]), tableRowNode([tableCellNode([textNode('Cell 1, Row 2')]), tableCellNode([textNode('Cell 2, Row 2')])])]), tableNode([tableRowNode([tableCellNode([textNode('Cell in Table 2')])])])]);
    const plaintext = convertLexicalToPlaintext({
      data
    });
    expect(plaintext).toBe('Cell 1, Row 1 | Cell 2, Row 1\nCell 1, Row 2 | Cell 2, Row 2\n\nCell in Table 2');
  });
});
//# sourceMappingURL=convertLexicalToPlaintext.spec.js.map