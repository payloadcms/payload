import { createHeadlessEditor } from '@lexical/headless';
import { $convertFromMarkdownString } from '../../../../packages/@lexical/markdown/index.js';
export function getMarkdownToLexical(allNodes, allTransformers) {
  const markdownToLexical = ({
    markdown
  }) => {
    const headlessEditor = createHeadlessEditor({
      nodes: allNodes
    });
    headlessEditor.update(() => {
      $convertFromMarkdownString(markdown, allTransformers);
    }, {
      discrete: true
    });
    const editorJSON = headlessEditor.getEditorState().toJSON();
    return editorJSON;
  };
  return markdownToLexical;
}
//# sourceMappingURL=getMarkdownToLexical.js.map