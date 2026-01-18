import { createHeadlessEditor } from '@lexical/headless';
import { getEnabledNodes } from '../../../lexical/nodes/index.js';
import { $convertToMarkdownString } from '../../../packages/@lexical/markdown/index.js';
export const convertLexicalToMarkdown = ({
  data,
  editorConfig
}) => {
  const headlessEditor = createHeadlessEditor({
    nodes: getEnabledNodes({
      editorConfig
    })
  });
  headlessEditor.update(() => {
    headlessEditor.setEditorState(headlessEditor.parseEditorState(data));
  }, {
    discrete: true
  });
  let markdown = '';
  headlessEditor.getEditorState().read(() => {
    markdown = $convertToMarkdownString(editorConfig?.features?.markdownTransformers);
  });
  return markdown;
};
//# sourceMappingURL=index.js.map