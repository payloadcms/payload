'use client';

import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { $findMatchingParent, mergeRegister } from '@lexical/utils';
import { getTranslation } from '@payloadcms/translations';
import { CloseMenuIcon, EditIcon, ExternalLinkIcon, formatDrawerSlug, useConfig, useEditDepth, useLocale, useTranslation } from '@payloadcms/ui';
import { requests } from '@payloadcms/ui/shared';
import { $getSelection, $isLineBreakNode, $isRangeSelection, COMMAND_PRIORITY_HIGH, COMMAND_PRIORITY_LOW, getDOMSelection, KEY_ESCAPE_COMMAND, SELECTION_CHANGE_COMMAND } from 'lexical';
import { formatAdminURL } from 'payload/shared';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditorConfigContext } from '../../../../../../lexical/config/client/EditorConfigProvider.js';
import { getSelectedNode } from '../../../../../../lexical/utils/getSelectedNode.js';
import { setFloatingElemPositionForLinkEditor } from '../../../../../../lexical/utils/setFloatingElemPositionForLinkEditor.js';
import { FieldsDrawer } from '../../../../../../utilities/fieldsDrawer/Drawer.js';
import { useLexicalDrawer } from '../../../../../../utilities/fieldsDrawer/useLexicalDrawer.js';
import { $isAutoLinkNode } from '../../../../nodes/AutoLinkNode.js';
import { $createLinkNode, $isLinkNode, TOGGLE_LINK_COMMAND } from '../../../../nodes/LinkNode.js';
import { TOGGLE_LINK_WITH_MODAL_COMMAND } from './commands.js';
function preventDefault(event) {
  event.preventDefault();
}
export function LinkEditor({
  anchorElem
}) {
  const [editor] = useLexicalComposerContext();
  // TO-DO: There are several states that should not be state, because they
  // are derived from linkNode (linkUrl, linkLabel, stateData, isLink, isAutoLink...)
  const [linkNode, setLinkNode] = useState();
  const editorRef = useRef(null);
  const [linkUrl, setLinkUrl] = useState(null);
  const [linkLabel, setLinkLabel] = useState(null);
  const {
    fieldProps: {
      schemaPath
    },
    uuid
  } = useEditorConfigContext();
  const isEditable = useLexicalEditable();
  const {
    config,
    getEntityConfig
  } = useConfig();
  const {
    i18n,
    t
  } = useTranslation();
  const [stateData, setStateData] = useState();
  const editDepth = useEditDepth();
  const [isLink, setIsLink] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const locale = useLocale();
  const [isAutoLink, setIsAutoLink] = useState(false);
  const drawerSlug = formatDrawerSlug({
    slug: `lexical-rich-text-link-` + uuid,
    depth: editDepth
  });
  const {
    toggleDrawer
  } = useLexicalDrawer(drawerSlug);
  const setNotLink = useCallback(() => {
    setIsLink(false);
    if (editorRef && editorRef.current) {
      editorRef.current.style.opacity = '0';
      editorRef.current.style.transform = 'translate(-10000px, -10000px)';
    }
    setIsAutoLink(false);
    setLinkUrl(null);
    setLinkLabel(null);
    setSelectedNodes([]);
    setStateData(undefined);
  }, [setIsLink, setLinkUrl, setLinkLabel, setSelectedNodes]);
  const $updateLinkEditor = useCallback(() => {
    const selection = $getSelection();
    let selectedNodeDomRect;
    if (!$isRangeSelection(selection) || !selection) {
      void setNotLink();
      return;
    }
    // Handle the data displayed in the floating link editor & drawer when you click on a link node
    const focusNode = getSelectedNode(selection);
    selectedNodeDomRect = editor.getElementByKey(focusNode.getKey())?.getBoundingClientRect();
    const focusLinkParent = $findMatchingParent(focusNode, $isLinkNode);
    // Prevent link modal from showing if selection spans further than the link: https://github.com/facebook/lexical/issues/4064
    const badNode = selection.getNodes().filter(node => !$isLineBreakNode(node)).find(node_0 => {
      const linkNode_0 = $findMatchingParent(node_0, $isLinkNode);
      return focusLinkParent && !focusLinkParent.is(linkNode_0) || linkNode_0 && !linkNode_0.is(focusLinkParent);
    });
    if (focusLinkParent == null || badNode) {
      setNotLink();
      return;
    }
    setLinkNode(focusLinkParent);
    const fields = focusLinkParent.getFields();
    // Initial state:
    const data = {
      ...fields,
      id: focusLinkParent.getID(),
      text: focusLinkParent.getTextContent()
    };
    if (fields?.linkType === 'custom') {
      setLinkUrl(fields?.url ?? null);
      setLinkLabel(null);
    } else {
      // internal link
      setLinkUrl(`${config.routes.admin === '/' ? '' : config.routes.admin}/collections/${fields?.doc?.relationTo}/${fields?.doc?.value}`);
      const relatedField = fields?.doc?.relationTo ? getEntityConfig({
        collectionSlug: fields?.doc?.relationTo
      }) : undefined;
      if (!relatedField) {
        // Usually happens if the user removed all default fields. In this case, we let them specify the label or do not display the label at all.
        // label could be a virtual field the user added. This is useful if they want to use the link feature for things other than links.
        setLinkLabel(fields?.label ? String(fields?.label) : null);
        setLinkUrl(fields?.url ? String(fields?.url) : null);
      } else {
        const id = typeof fields.doc?.value === 'object' ? fields.doc.value.id : fields.doc?.value;
        const collection = fields.doc?.relationTo;
        if (!id || !collection) {
          throw new Error(`Focus link parent is missing doc.value or doc.relationTo`);
        }
        const loadingLabel = t('fields:linkedTo', {
          label: `${getTranslation(relatedField.labels.singular, i18n)} - ${t('lexical:link:loadingWithEllipsis', i18n)}`
        }).replace(/<[^>]*>?/g, '');
        setLinkLabel(loadingLabel);
        requests.get(formatAdminURL({
          apiRoute: config.routes.api,
          path: `/${collection}/${id}`,
          serverURL: config.serverURL
        }), {
          headers: {
            'Accept-Language': i18n.language
          },
          params: {
            depth: 0,
            locale: locale?.code
          }
        }).then(async res => {
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          const data_0 = await res.json();
          const useAsTitle = relatedField?.admin?.useAsTitle || 'id';
          const title = data_0[useAsTitle];
          const label = t('fields:linkedTo', {
            label: `${getTranslation(relatedField.labels.singular, i18n)} - ${title}`
          }).replace(/<[^>]*>?/g, '');
          setLinkLabel(label);
        }).catch(() => {
          const label_0 = t('fields:linkedTo', {
            label: `${getTranslation(relatedField.labels.singular, i18n)} - ${t('general:untitled', i18n)} - ID: ${id}`
          }).replace(/<[^>]*>?/g, '');
          setLinkLabel(label_0);
        });
      }
    }
    setStateData(data);
    setIsLink(true);
    setSelectedNodes(selection ? selection?.getNodes() : []);
    if ($isAutoLinkNode(focusLinkParent)) {
      setIsAutoLink(true);
    } else {
      setIsAutoLink(false);
    }
    const editorElem = editorRef.current;
    const nativeSelection = getDOMSelection(editor._window);
    const {
      activeElement
    } = document;
    if (editorElem === null) {
      return;
    }
    const rootElement = editor.getRootElement();
    if (nativeSelection !== null && rootElement !== null && rootElement.contains(nativeSelection.anchorNode)) {
      if (!selectedNodeDomRect) {
        // Get the DOM rect of the selected node using the native selection. This sometimes produces the wrong
        // result, which is why we use lexical's selection preferably.
        selectedNodeDomRect = nativeSelection.getRangeAt(0).getBoundingClientRect();
      }
      if (selectedNodeDomRect != null) {
        selectedNodeDomRect.y += 40;
        setFloatingElemPositionForLinkEditor(selectedNodeDomRect, editorElem, anchorElem);
      }
    } else if (activeElement == null || activeElement.className !== 'link-input') {
      if (rootElement !== null) {
        setFloatingElemPositionForLinkEditor(null, editorElem, anchorElem);
      }
      setLinkUrl(null);
      setLinkLabel(null);
    }
    return true;
  }, [editor, setNotLink, config.routes.admin, config.routes.api, config.serverURL, getEntityConfig, t, i18n, locale?.code, anchorElem]);
  useEffect(() => {
    return mergeRegister(editor.registerCommand(TOGGLE_LINK_WITH_MODAL_COMMAND, payload => {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, payload);
      // Now, open the modal
      $updateLinkEditor();
      toggleDrawer();
      return true;
    }, COMMAND_PRIORITY_LOW));
  }, [editor, $updateLinkEditor, toggleDrawer, drawerSlug]);
  useEffect(() => {
    const scrollerElem = anchorElem.parentElement;
    const update = () => {
      editor.getEditorState().read(() => {
        void $updateLinkEditor();
      });
    };
    window.addEventListener('resize', update);
    if (scrollerElem != null) {
      scrollerElem.addEventListener('scroll', update);
    }
    return () => {
      window.removeEventListener('resize', update);
      if (scrollerElem != null) {
        scrollerElem.removeEventListener('scroll', update);
      }
    };
  }, [anchorElem.parentElement, editor, $updateLinkEditor]);
  useEffect(() => {
    return mergeRegister(editor.registerUpdateListener(({
      editorState
    }) => {
      editorState.read(() => {
        void $updateLinkEditor();
      });
    }), editor.registerCommand(SELECTION_CHANGE_COMMAND, () => {
      void $updateLinkEditor();
      return true;
    }, COMMAND_PRIORITY_LOW), editor.registerCommand(KEY_ESCAPE_COMMAND, () => {
      if (isLink) {
        setNotLink();
        return true;
      }
      return false;
    }, COMMAND_PRIORITY_HIGH));
  }, [editor, $updateLinkEditor, isLink, setNotLink]);
  useEffect(() => {
    editor.getEditorState().read(() => {
      void $updateLinkEditor();
    });
  }, [editor, $updateLinkEditor]);
  return /*#__PURE__*/_jsxs(React.Fragment, {
    children: [/*#__PURE__*/_jsx("div", {
      className: "link-editor",
      ref: editorRef,
      children: /*#__PURE__*/_jsxs("div", {
        className: "link-input",
        children: [linkUrl && linkUrl.length > 0 ? /*#__PURE__*/_jsxs("a", {
          href: linkUrl,
          rel: "noopener noreferrer",
          target: "_blank",
          children: [linkNode?.__fields.newTab ? /*#__PURE__*/_jsx(ExternalLinkIcon, {}) : null, linkLabel != null && linkLabel.length > 0 ? linkLabel : linkUrl]
        }) : linkLabel != null && linkLabel.length > 0 ? /*#__PURE__*/_jsxs(_Fragment, {
          children: [linkNode?.__fields.newTab ? /*#__PURE__*/_jsx(ExternalLinkIcon, {}) : null, /*#__PURE__*/_jsx("span", {
            className: "link-input__label-pure",
            children: linkLabel
          })]
        }) : null, isEditable && /*#__PURE__*/_jsxs(React.Fragment, {
          children: [/*#__PURE__*/_jsx("button", {
            "aria-label": "Edit link",
            className: "link-edit",
            onClick: event => {
              event.preventDefault();
              toggleDrawer();
            },
            onMouseDown: preventDefault,
            tabIndex: 0,
            type: "button",
            children: /*#__PURE__*/_jsx(EditIcon, {})
          }), !isAutoLink && /*#__PURE__*/_jsx("button", {
            "aria-label": "Remove link",
            className: "link-trash",
            onClick: () => {
              editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
            },
            onMouseDown: preventDefault,
            tabIndex: 0,
            type: "button",
            children: /*#__PURE__*/_jsx(CloseMenuIcon, {})
          })]
        })]
      })
    }), /*#__PURE__*/_jsx(FieldsDrawer, {
      className: "lexical-link-edit-drawer",
      data: stateData,
      drawerSlug: drawerSlug,
      drawerTitle: t('fields:editLink'),
      featureKey: "link",
      handleDrawerSubmit: (fields_0, data_1) => {
        const newLinkPayload = data_1;
        const bareLinkFields = {
          ...newLinkPayload
        };
        delete bareLinkFields.text;
        // See: https://github.com/facebook/lexical/pull/5536. This updates autolink nodes to link nodes whenever a change was made (which is good!).
        editor.update(() => {
          const selection_0 = $getSelection();
          let linkParent = null;
          if ($isRangeSelection(selection_0)) {
            linkParent = getSelectedNode(selection_0).getParent();
          } else {
            if (selectedNodes.length) {
              linkParent = selectedNodes[0]?.getParent() ?? null;
            }
          }
          if (linkParent && $isAutoLinkNode(linkParent)) {
            const linkNode_1 = $createLinkNode({
              fields: bareLinkFields
            });
            linkParent.replace(linkNode_1, true);
          }
        });
        // Needs to happen AFTER a potential auto link => link node conversion, as otherwise, the updated text to display may be lost due to
        // it being applied to the auto link node instead of the link node.
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, {
          fields: bareLinkFields,
          selectedNodes,
          text: newLinkPayload.text
        });
      },
      schemaPath: schemaPath,
      schemaPathSuffix: "fields"
    })]
  });
}
//# sourceMappingURL=index.js.map