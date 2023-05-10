import React, { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReactEditor, useSlate } from 'slate-react';
import { Transforms, Range, Editor } from 'slate';
import { useModal } from '@faceless-ui/modal';
import ElementButton from '../../Button';
import LinkIcon from '../../../../../../icons/Link';
import reduceFieldsToValues from '../../../../../Form/reduceFieldsToValues';
import { useConfig } from '../../../../../../utilities/Config';
import isElementActive from '../../isActive';
import { unwrapLink } from '../utilities';
import { getBaseFields } from '../LinkDrawer/baseFields';
import { LinkDrawer } from '../LinkDrawer';
import { Field } from '../../../../../../../../fields/config/types';
import { Props as RichTextFieldProps } from '../../../types';
import buildStateFromSchema from '../../../../../Form/buildStateFromSchema';
import { useAuth } from '../../../../../../utilities/Auth';
import { Fields } from '../../../../../Form/types';
import { useLocale } from '../../../../../../utilities/Locale';
import { useDrawerSlug } from '../../../../../../elements/Drawer/useDrawerSlug';

const insertLink = (editor, fields) => {
  const isCollapsed = editor.selection && Range.isCollapsed(editor.selection);
  const data = reduceFieldsToValues(fields, true);

  const newLink = {
    type: 'link',
    linkType: data.linkType,
    url: data.url,
    doc: data.doc,
    newTab: data.newTab,
    fields: data.fields,
    children: [],
  };

  if (isCollapsed || !editor.selection) {
    // If selection anchor and focus are the same,
    // Just inject a new node with children already set
    Transforms.insertNodes(editor, {
      ...newLink,
      children: [{ text: String(data.text) }],
    });
  } else if (editor.selection) {
    // Otherwise we need to wrap the selected node in a link,
    // Delete its old text,
    // Move the selection one position forward into the link,
    // And insert the text back into the new link
    Transforms.wrapNodes(editor, newLink, { split: true });
    Transforms.delete(editor, { at: editor.selection.focus.path, unit: 'word' });
    Transforms.move(editor, { distance: 1, unit: 'offset' });
    Transforms.insertText(editor, String(data.text), { at: editor.selection.focus.path });
  }

  ReactEditor.focus(editor);
};

export const LinkButton: React.FC<{
  path: string
  fieldProps: RichTextFieldProps
}> = ({ fieldProps }) => {
  const customFieldSchema = fieldProps?.admin?.link?.fields;
  const { user } = useAuth();
  const locale = useLocale();
  const [initialState, setInitialState] = useState<Fields>({});

  const { t, i18n } = useTranslation(['upload', 'general']);
  const editor = useSlate();
  const config = useConfig();

  const [fieldSchema] = useState(() => {
    const baseFields: Field[] = getBaseFields(config);

    const fields = typeof customFieldSchema === 'function' ? customFieldSchema({ defaultFields: baseFields, config, i18n }) : baseFields;

    if (Array.isArray(customFieldSchema)) {
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

  const { openModal, closeModal } = useModal();
  const drawerSlug = useDrawerSlug('rich-text-link');

  return (
    <Fragment>
      <ElementButton
        format="link"
        tooltip={t('fields:addLink')}
        className="link"
        onClick={async () => {
          if (isElementActive(editor, 'link')) {
            unwrapLink(editor);
          } else {
            openModal(drawerSlug);

            const isCollapsed = editor.selection && Range.isCollapsed(editor.selection);

            if (!isCollapsed) {
              const data = {
                text: editor.selection ? Editor.string(editor, editor.selection) : '',
              };

              const state = await buildStateFromSchema({ fieldSchema, data, user, operation: 'create', locale, t });
              setInitialState(state);
            }
          }
        }}
      >
        <LinkIcon />
      </ElementButton>
      <LinkDrawer
        drawerSlug={drawerSlug}
        handleModalSubmit={(fields) => {
          insertLink(editor, fields);
          closeModal(drawerSlug);
        }}
        initialState={initialState}
        fieldSchema={fieldSchema}
        handleClose={() => {
          closeModal(drawerSlug);
        }}
      />
    </Fragment>
  );
};
