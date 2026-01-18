import { createHeadlessEditor } from '@lexical/headless';
import { getEnabledNodes } from '../../../lexical/nodes/index.js';
import { $convertFromMarkdownString } from '../../../packages/@lexical/markdown/index.js';
export const convertMarkdownToLexical = ({
  editorConfig,
  markdown
}) => {
  const headlessEditor = createHeadlessEditor({
    nodes: getEnabledNodes({
      editorConfig
    })
  });
  headlessEditor.update(() => {
    $convertFromMarkdownString(markdown, editorConfig.features.markdownTransformers);
  }, {
    discrete: true
  });
  const editorJSON = headlessEditor.getEditorState().toJSON();
  return editorJSON;
};
//# sourceMappingURL=index.js.map