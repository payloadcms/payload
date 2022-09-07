import React, { Fragment, useState } from 'react';
import { ReactEditor, useSlate } from 'slate-react';
import { Transforms, Editor, Range } from 'slate';
import { useModal } from '@faceless-ui/modal';
import ElementButton from '../Button';
import { unwrapLink } from './utilities';
import LinkIcon from '../../../../../icons/Link';
import { EditModal } from './Modal';
import { modalSlug } from './shared';
import isElementActive from '../isActive';
import { Fields } from '../../../../Form/types';
import buildStateFromSchema from '../../../../Form/buildStateFromSchema';
import { useAuth } from '../../../../../utilities/Auth';
import { useLocale } from '../../../../../utilities/Locale';
import { useConfig } from '../../../../../utilities/Config';
import { getBaseFields } from './Modal/baseFields';
import { Field } from '../../../../../../../fields/config/types';

export const LinkButton = ({ fieldProps }) => {
  const customFieldSchema = fieldProps?.admin?.link?.fields;

  const config = useConfig();
  const editor = useSlate();
  const { user } = useAuth();
  const locale = useLocale();
  const { open, closeAll } = useModal();
  const [renderModal, setRenderModal] = useState(false);
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

  return (
    <Fragment>
      <ElementButton
        format="link"
        onClick={async () => {
          if (isElementActive(editor, 'link')) {
            unwrapLink(editor);
          } else {
            open(modalSlug);
            setRenderModal(true);

            const isCollapsed = editor.selection && Range.isCollapsed(editor.selection);

            if (!isCollapsed) {
              const data = {
                text: Editor.string(editor, editor.selection),
              };

              const state = await buildStateFromSchema({ fieldSchema, data, user, operation: 'create', locale });
              setInitialState(state);
            }
          }
        }}
      >
        <LinkIcon />
      </ElementButton>
      {renderModal && (
        <EditModal
          fieldSchema={fieldSchema}
          initialState={initialState}
          close={() => {
            closeAll();
            setRenderModal(false);
          }}
          handleModalSubmit={(_, data) => {
            const isCollapsed = editor.selection && Range.isCollapsed(editor.selection);

            const newLink = {
              type: 'link',
              linkType: data.linkType,
              url: data.url,
              doc: data.doc,
              newTab: data.newTab,
              fields: data.fields,
              children: [],
            };

            if (isCollapsed) {
              // If selection anchor and focus are the same,
              // Just inject a new node with children already set
              Transforms.insertNodes(editor, {
                ...newLink,
                children: [{ text: String(data.text) }],
              });
            } else {
              // Otherwise we need to wrap the selected node in a link,
              // Delete its old text,
              // Move the selection one position forward into the link,
              // And insert the text back into the new link
              Transforms.wrapNodes(editor, newLink, { split: true });
              Transforms.delete(editor, { at: editor.selection.focus.path, unit: 'word' });
              Transforms.move(editor, { distance: 1, unit: 'offset' });
              Transforms.insertText(editor, String(data.text), { at: editor.selection.focus.path });
            }

            closeAll();
            setRenderModal(false);

            ReactEditor.focus(editor);
          }}
        />
      )}
    </Fragment>
  );
};
