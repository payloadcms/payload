'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { $dfsIterator, $insertNodeToNearestRoot, mergeRegister } from '@lexical/utils';
import { useBulkUpload, useEffectEvent, useModal } from '@payloadcms/ui';
import ObjectID from 'bson-objectid';
import { $createRangeSelection, $getPreviousSelection, $getSelection, $isParagraphNode, $isRangeSelection, $setSelection, COMMAND_PRIORITY_EDITOR, COMMAND_PRIORITY_LOW, createCommand, DROP_COMMAND, getDOMSelectionFromTarget, isHTMLElement, PASTE_COMMAND } from 'lexical';
import React, { useEffect } from 'react';
import { useEnabledRelationships } from '../../../relationship/client/utils/useEnabledRelationships.js';
import { UploadDrawer } from '../drawer/index.js';
import { $createUploadNode, $isUploadNode, UploadNode } from '../nodes/UploadNode.js';
function canDropImage(event) {
  const target = event.target;
  return !!(isHTMLElement(target) && !target.closest('code, span.editor-image') && isHTMLElement(target.parentElement) && target.parentElement.closest('div.ContentEditable__root'));
}
function getDragSelection(event) {
  // Source: https://github.com/AlessioGr/lexical/blob/main/packages/lexical-playground/src/plugins/ImagesPlugin/index.tsx
  let range;
  const domSelection = getDOMSelectionFromTarget(event.target);
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(event.clientX, event.clientY);
  } else if (event.rangeParent && domSelection !== null) {
    domSelection.collapse(event.rangeParent, event.rangeOffset || 0);
    range = domSelection.getRangeAt(0);
  } else {
    throw Error(`Cannot get the selection when dragging`);
  }
  return range;
}
export const INSERT_UPLOAD_COMMAND = createCommand('INSERT_UPLOAD_COMMAND');
export const UploadPlugin = t0 => {
  const $ = _c(21);
  const {
    clientProps
  } = t0;
  const [editor] = useLexicalComposerContext();
  const t1 = clientProps?.disabledCollections;
  const t2 = clientProps?.enabledCollections;
  let t3;
  if ($[0] !== t1 || $[1] !== t2) {
    t3 = {
      collectionSlugsBlacklist: t1,
      collectionSlugsWhitelist: t2,
      uploads: true
    };
    $[0] = t1;
    $[1] = t2;
    $[2] = t3;
  } else {
    t3 = $[2];
  }
  const {
    enabledCollectionSlugs
  } = useEnabledRelationships(t3);
  const {
    drawerSlug: bulkUploadDrawerSlug,
    setCollectionSlug,
    setInitialForms,
    setOnCancel,
    setOnSuccess,
    setSelectableCollections
  } = useBulkUpload();
  const {
    isModalOpen,
    openModal
  } = useModal();
  let t4;
  if ($[3] !== bulkUploadDrawerSlug || $[4] !== editor || $[5] !== enabledCollectionSlugs || $[6] !== isModalOpen || $[7] !== openModal || $[8] !== setCollectionSlug || $[9] !== setInitialForms || $[10] !== setOnCancel || $[11] !== setOnSuccess || $[12] !== setSelectableCollections) {
    t4 = t5 => {
      const {
        files
      } = t5;
      if (files?.length === 0) {
        return;
      }
      setInitialForms(initialForms => [...(initialForms ?? []), ...files.map(_temp)]);
      if (!isModalOpen(bulkUploadDrawerSlug)) {
        if (!enabledCollectionSlugs.length || !enabledCollectionSlugs[0]) {
          return;
        }
        setCollectionSlug(enabledCollectionSlugs[0]);
        setSelectableCollections(enabledCollectionSlugs);
        setOnCancel(() => {
          editor.update(_temp2);
        });
        setOnSuccess(newDocs => {
          const newDocsMap = new Map(newDocs.map(_temp3));
          editor.update(() => {
            for (const dfsNode_0 of $dfsIterator()) {
              const node_0 = dfsNode_0.node;
              if ($isUploadNode(node_0)) {
                const nodeData_0 = node_0.getData();
                if (nodeData_0?.pending) {
                  const newDoc = newDocsMap.get(nodeData_0.pending?.formID);
                  if (newDoc) {
                    node_0.replace($createUploadNode({
                      data: {
                        id: new ObjectID.default().toHexString(),
                        fields: {},
                        relationTo: newDoc.collectionSlug,
                        value: newDoc.doc.id
                      }
                    }));
                  }
                }
              }
            }
          });
        });
        openModal(bulkUploadDrawerSlug);
      }
    };
    $[3] = bulkUploadDrawerSlug;
    $[4] = editor;
    $[5] = enabledCollectionSlugs;
    $[6] = isModalOpen;
    $[7] = openModal;
    $[8] = setCollectionSlug;
    $[9] = setInitialForms;
    $[10] = setOnCancel;
    $[11] = setOnSuccess;
    $[12] = setSelectableCollections;
    $[13] = t4;
  } else {
    t4 = $[13];
  }
  const openBulkUpload = useEffectEvent(t4);
  let t5;
  if ($[14] !== editor || $[15] !== openBulkUpload) {
    t5 = () => {
      if (!editor.hasNodes([UploadNode])) {
        throw new Error("UploadPlugin: UploadNode not registered on editor");
      }
      return mergeRegister(editor.registerNodeTransform(UploadNode, node_1 => {
        const nodeData_1 = node_1.getData();
        if (!nodeData_1?.pending) {
          return;
        }
        const upload = async function upload() {
          let transformedImage = null;
          const src = nodeData_1?.pending?.src;
          const formID = nodeData_1?.pending?.formID;
          if (src?.startsWith("data:")) {
            const mimeMatch = src.match(/data:(image\/[a-zA-Z]+);base64,/);
            const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
            const base64Data = src.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const file_0 = new File([byteArray], "pasted-image." + mimeType?.split("/", 2)[1], {
              type: mimeType
            });
            transformedImage = {
              alt: undefined,
              file: file_0,
              formID
            };
          } else {
            if (src?.startsWith("http") || src?.startsWith("https")) {
              const res = await fetch(src);
              const blob = await res.blob();
              const inferredFileName = src.split("/").pop() || "pasted-image" + blob.type.split("/", 2)[1];
              const file_1 = new File([blob], inferredFileName, {
                type: blob.type
              });
              transformedImage = {
                alt: undefined,
                file: file_1,
                formID
              };
            }
          }
          if (!transformedImage) {
            return;
          }
          openBulkUpload({
            files: [transformedImage]
          });
        };
        upload();
      }), editor.registerCommand(INSERT_UPLOAD_COMMAND, payload => {
        editor.update(() => {
          const selection = $getSelection() || $getPreviousSelection();
          if ($isRangeSelection(selection)) {
            const uploadNode = $createUploadNode({
              data: {
                id: payload.id,
                fields: payload.fields,
                relationTo: payload.relationTo,
                value: payload.value
              }
            });
            const {
              focus
            } = selection;
            const focusNode = focus.getNode();
            $insertNodeToNearestRoot(uploadNode);
            if ($isParagraphNode(focusNode) && !focusNode.__first) {
              focusNode.remove();
            }
          }
        });
        return true;
      }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(PASTE_COMMAND, event => {
        if (!(event instanceof ClipboardEvent)) {
          return false;
        }
        const clipboardData = event.clipboardData;
        if (!clipboardData?.types?.length || clipboardData?.types?.includes("text/html")) {
          return false;
        }
        const files_0 = [];
        if (clipboardData?.files?.length) {
          Array.from(clipboardData.files).forEach(file_2 => {
            files_0.push({
              alt: "",
              file: file_2,
              formID: new ObjectID.default().toHexString()
            });
          });
        }
        if (files_0.length) {
          editor.update(() => {
            const selection_0 = $getSelection() || $getPreviousSelection();
            if ($isRangeSelection(selection_0)) {
              for (const file_3 of files_0) {
                const pendingUploadNode = $createUploadNode({
                  data: {
                    pending: {
                      formID: file_3.formID,
                      src: URL.createObjectURL(file_3.file)
                    }
                  }
                });
                const {
                  focus: focus_0
                } = selection_0;
                const focusNode_0 = focus_0.getNode();
                $insertNodeToNearestRoot(pendingUploadNode);
                if ($isParagraphNode(focusNode_0) && !focusNode_0.__first) {
                  focusNode_0.remove();
                }
              }
            }
          });
          openBulkUpload({
            files: files_0
          });
          return true;
        }
        return false;
      }, COMMAND_PRIORITY_LOW), editor.registerCommand(DROP_COMMAND, event_0 => {
        if (!(event_0 instanceof DragEvent)) {
          return false;
        }
        const dt = event_0.dataTransfer;
        if (!dt?.types?.length) {
          return false;
        }
        const files_1 = [];
        if (dt?.files?.length) {
          Array.from(dt.files).forEach(file_4 => {
            files_1.push({
              alt: "",
              file: file_4,
              formID: new ObjectID.default().toHexString()
            });
          });
        }
        if (files_1.length) {
          event_0.preventDefault();
          event_0.stopPropagation();
          editor.update(() => {
            if (canDropImage(event_0)) {
              const range = getDragSelection(event_0);
              const selection_1 = $createRangeSelection();
              if (range !== null && range !== undefined) {
                selection_1.applyDOMRange(range);
              }
              $setSelection(selection_1);
              for (const file_5 of files_1) {
                const pendingUploadNode_0 = $createUploadNode({
                  data: {
                    pending: {
                      formID: file_5.formID,
                      src: URL.createObjectURL(file_5.file)
                    }
                  }
                });
                const {
                  focus: focus_1
                } = selection_1;
                const focusNode_1 = focus_1.getNode();
                $insertNodeToNearestRoot(pendingUploadNode_0);
                if ($isParagraphNode(focusNode_1) && !focusNode_1.__first) {
                  focusNode_1.remove();
                }
              }
            }
          });
          openBulkUpload({
            files: files_1
          });
          return true;
        }
        return false;
      }, COMMAND_PRIORITY_LOW));
    };
    $[14] = editor;
    $[15] = openBulkUpload;
    $[16] = t5;
  } else {
    t5 = $[16];
  }
  let t6;
  if ($[17] !== editor) {
    t6 = [editor];
    $[17] = editor;
    $[18] = t6;
  } else {
    t6 = $[18];
  }
  useEffect(t5, t6);
  let t7;
  if ($[19] !== enabledCollectionSlugs) {
    t7 = _jsx(UploadDrawer, {
      enabledCollectionSlugs
    });
    $[19] = enabledCollectionSlugs;
    $[20] = t7;
  } else {
    t7 = $[20];
  }
  return t7;
};
function _temp(file) {
  return {
    file: file.file,
    formID: file.formID
  };
}
function _temp2() {
  for (const dfsNode of $dfsIterator()) {
    const node = dfsNode.node;
    if ($isUploadNode(node)) {
      const nodeData = node.getData();
      if (nodeData?.pending) {
        node.remove();
      }
    }
  }
}
function _temp3(doc) {
  return [doc.formID, doc];
}
//# sourceMappingURL=index.js.map