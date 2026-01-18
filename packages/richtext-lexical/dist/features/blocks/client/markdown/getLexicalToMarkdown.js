import { createHeadlessEditor } from '@lexical/headless';
import { $convertToMarkdownString } from '../../../../packages/@lexical/markdown/index.js';
export function getLexicalToMarkdown(allNodes, allTransformers) {
  const lexicalToMarkdown = ({
    editorState
  }) => {
    const headlessEditor = createHeadlessEditor({
      nodes: allNodes
    });
    try {
      headlessEditor.setEditorState(headlessEditor.parseEditorState(editorState)); // This should commit the editor state immediately
    } catch (e) {
      console.error('getLexicalToMarkdown: ERROR parsing editor state', e);
    }
    let markdown = '';
    headlessEditor.getEditorState().read(() => {
      markdown = $convertToMarkdownString(allTransformers);
    });
    return markdown;
  };
  return lexicalToMarkdown;
}
//# sourceMappingURL=getLexicalToMarkdown.js.map