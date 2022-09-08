import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { ReactEditor, useSlate } from 'slate-react';
import { Transforms, Node, Editor } from 'slate';
import { useModal } from '@faceless-ui/modal';
import { unwrapLink } from './utilities';
import Popup from '../../../../../elements/Popup';
import { EditModal } from './Modal';
import { modalSlug as baseModalSlug } from './shared';
import { Fields } from '../../../../Form/types';
import buildStateFromSchema from '../../../../Form/buildStateFromSchema';
import { useAuth } from '../../../../../utilities/Auth';
import { useLocale } from '../../../../../utilities/Locale';
import { useConfig } from '../../../../../utilities/Config';
import { getBaseFields } from './Modal/baseFields';
import { Field } from '../../../../../../../fields/config/types';
import reduceFieldsToValues from '../../../../Form/reduceFieldsToValues';
import deepCopyObject from '../../../../../../../utilities/deepCopyObject';
import Button from '../../../../../elements/Button';

import './index.scss';

const baseClass = 'rich-text-link';

// TODO: Multiple modal windows stacked go boom (rip). Edit Upload in fields -> rich text

export const LinkElement = ({ attributes, children, element, editorRef, fieldProps }) => {
  const customFieldSchema = fieldProps?.admin?.link?.fields;

  const editor = useSlate();
  const config = useConfig();
  const { user } = useAuth();
  const locale = useLocale();
  const { open, closeAll } = useModal();
  const [renderModal, setRenderModal] = useState(false);
  const [renderPopup, setRenderPopup] = useState(false);
  const [initialState, setInitialState] = useState<Fields>({});
  const [fieldSchema] = useState(() => {
    const fields: Field[] = [
      ...getBaseFields(config),
    ];

    if (customFieldSchema) {
      fields.push({
        name: 'fields',
        type: 'group',
        admin: {
          style: {
            margin: 0,
            padding: 0,
            borderTop: 0,
            borderBottom: 0,
          },
        },
        fields: customFieldSchema,
      });
    }

    return fields;
  });

  const modalSlug = `${baseModalSlug}-${fieldProps.path}`;

  const handleTogglePopup = useCallback((render) => {
    if (!render) {
      setRenderPopup(render);
    }
  }, []);

  useEffect(() => {
    const awaitInitialState = async () => {
      const data = {
        text: Node.string(element),
        linkType: element.linkType,
        url: element.url,
        doc: element.doc,
        newTab: element.newTab,
        fields: deepCopyObject(element.fields),
      };

      const state = await buildStateFromSchema({ fieldSchema, data, user, operation: 'update', locale });
      setInitialState(state);
    };

    awaitInitialState();
  }, [renderModal, element, fieldSchema, user, locale]);

  return (
    <span
      className={baseClass}
      {...attributes}
    >
      <span
        style={{ userSelect: 'none' }}
        contentEditable={false}
      >
        {renderModal && (
          <EditModal
            modalSlug={modalSlug}
            fieldSchema={fieldSchema}
            close={() => {
              closeAll();
              setRenderModal(false);
            }}
            handleModalSubmit={(fields) => {
              closeAll();
              setRenderModal(false);

              const data = reduceFieldsToValues(fields, true);

              const [, parentPath] = Editor.above(editor);

              const newNode: Record<string, unknown> = {
                newTab: data.newTab,
                url: data.url,
                linkType: data.linkType,
                doc: data.doc,
              };

              if (customFieldSchema) {
                newNode.fields = data.fields;
              }

              Transforms.setNodes(
                editor,
                newNode,
                { at: parentPath },
              );

              Transforms.delete(editor, { at: editor.selection.focus.path, unit: 'block' });
              Transforms.move(editor, { distance: 1, unit: 'offset' });
              Transforms.insertText(editor, String(data.text), { at: editor.selection.focus.path });

              ReactEditor.focus(editor);
            }}
            initialState={initialState}
          />
        )}
        <Popup
          buttonType="none"
          size="small"
          forceOpen={renderPopup}
          onToggleOpen={handleTogglePopup}
          horizontalAlign="left"
          verticalAlign="bottom"
          boundingRef={editorRef}
          render={() => (
            <div className={`${baseClass}__popup`}>
              {element.linkType === 'internal' && element.doc?.relationTo && element.doc?.value && (
                <Fragment>
                  Linked to&nbsp;
                  <a
                    className={`${baseClass}__link-label`}
                    href={`${config.routes.admin}/collections/${element.doc.relationTo}/${element.doc.value}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {config.collections.find(({ slug }) => slug === element.doc.relationTo)?.labels?.singular}
                  </a>
                </Fragment>
              )}
              {(element.linkType === 'custom' || !element.linkType) && (
                <a
                  className={`${baseClass}__link-label`}
                  href={element.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {element.url}
                </a>
              )}
              <Button
                icon="edit"
                round
                buttonStyle="icon-label"
                onClick={(e) => {
                  e.preventDefault();
                  setRenderPopup(false);
                  open(modalSlug);
                  setRenderModal(true);
                }}
                tooltip="Edit"
              />
              <Button
                icon="x"
                round
                buttonStyle="icon-label"
                onClick={(e) => {
                  e.preventDefault();
                  unwrapLink(editor);
                }}
                tooltip="Remove"
              />
            </div>
          )}
        />
      </span>
      <span
        tabIndex={0}
        role="button"
        className={[
          `${baseClass}__button`,
        ].filter(Boolean).join(' ')}
        onKeyDown={(e) => { if (e.key === 'Enter') setRenderPopup(true); }}
        onClick={() => setRenderPopup(true)}
      >
        {children}
      </span>
    </span>
  );
};
