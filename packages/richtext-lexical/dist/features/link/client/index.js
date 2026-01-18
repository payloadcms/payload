'use client';

import { $findMatchingParent } from '@lexical/utils';
import { $getSelection, $isRangeSelection } from 'lexical';
import { LinkIcon } from '../../../lexical/ui/icons/Link/index.js';
import { getSelectedNode } from '../../../lexical/utils/getSelectedNode.js';
import { createClientFeature } from '../../../utilities/createClientFeature.js';
import { toolbarFeatureButtonsGroupWithItems } from '../../shared/toolbar/featureButtonsGroup.js';
import { LinkMarkdownTransformer } from '../markdownTransformer.js';
import { AutoLinkNode } from '../nodes/AutoLinkNode.js';
import { $isLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from '../nodes/LinkNode.js';
import { AutoLinkPlugin } from './plugins/autoLink/index.js';
import { ClickableLinkPlugin } from './plugins/clickableLink/index.js';
import { FloatingLinkEditorPlugin } from './plugins/floatingLinkEditor/index.js';
import { TOGGLE_LINK_WITH_MODAL_COMMAND } from './plugins/floatingLinkEditor/LinkEditor/commands.js';
import { LinkPlugin } from './plugins/link/index.js';
const toolbarGroups = [toolbarFeatureButtonsGroupWithItems([{
  ChildComponent: LinkIcon,
  isActive: ({
    selection
  }) => {
    if ($isRangeSelection(selection)) {
      const selectedNode = getSelectedNode(selection);
      const linkParent = $findMatchingParent(selectedNode, $isLinkNode);
      return linkParent != null;
    }
    return false;
  },
  isEnabled: ({
    selection
  }) => {
    return !!($isRangeSelection(selection) && $getSelection()?.getTextContent()?.length);
  },
  key: 'link',
  label: ({
    i18n
  }) => {
    return i18n.t('lexical:link:label');
  },
  onSelect: ({
    editor,
    isActive
  }) => {
    if (!isActive) {
      let selectedText;
      let selectedNodes = [];
      editor.getEditorState().read(() => {
        selectedText = $getSelection()?.getTextContent();
        // We need to selected nodes here before the drawer opens, as clicking around in the drawer may change the original selection
        selectedNodes = $getSelection()?.getNodes() ?? [];
      });
      if (!selectedText?.length) {
        return;
      }
      const linkFields = {
        doc: null
      };
      editor.dispatchCommand(TOGGLE_LINK_WITH_MODAL_COMMAND, {
        fields: linkFields,
        selectedNodes,
        text: selectedText
      });
    } else {
      // remove link
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  },
  order: 1
}])];
export const LinkFeatureClient = createClientFeature(({
  props
}) => ({
  markdownTransformers: [LinkMarkdownTransformer],
  nodes: [LinkNode, props?.disableAutoLinks === true ? null : AutoLinkNode].filter(Boolean),
  plugins: [{
    Component: LinkPlugin,
    position: 'normal'
  }, props?.disableAutoLinks === true || props?.disableAutoLinks === 'creationOnly' ? null : {
    Component: AutoLinkPlugin,
    position: 'normal'
  }, {
    Component: ClickableLinkPlugin,
    position: 'normal'
  }, {
    Component: FloatingLinkEditorPlugin,
    position: 'floatingAnchorElem'
  }].filter(Boolean),
  sanitizedClientFeatureProps: props,
  toolbarFixed: {
    groups: toolbarGroups
  },
  toolbarInline: {
    groups: toolbarGroups
  }
}));
//# sourceMappingURL=index.js.map