import { createHeadlessEditor } from '@lexical/headless';
import { $getRoot, $getSelection } from 'lexical';
import { getEnabledNodes } from '../../../lexical/nodes/index.js';
import { $generateNodesFromDOM } from '../../../lexical-proxy/@lexical-html.js';
export const convertHTMLToLexical = ({
  editorConfig,
  html,
  JSDOM
}) => {
  const headlessEditor = createHeadlessEditor({
    nodes: getEnabledNodes({
      editorConfig
    })
  });
  headlessEditor.update(() => {
    const dom = new JSDOM(html);
    const nodes = $generateNodesFromDOM(headlessEditor, dom.window.document);
    $getRoot().select();
    const selection = $getSelection();
    if (selection === null) {
      throw new Error('Selection is null');
    }
    selection.insertNodes(nodes);
  }, {
    discrete: true
  });
  const editorJSON = headlessEditor.getEditorState().toJSON();
  return editorJSON;
};
//# sourceMappingURL=index.js.map