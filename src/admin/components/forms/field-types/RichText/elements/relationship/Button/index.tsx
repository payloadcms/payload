import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { ReactEditor, useSlate } from 'slate-react';
import { useTranslation } from 'react-i18next';
import ElementButton from '../../Button';
import RelationshipIcon from '../../../../../../icons/Relationship';
import { injectVoidElement } from '../../injectVoid';
import { useListDrawer } from '../../../../../../elements/ListDrawer';
import { EnabledRelationshipsCondition } from '../../EnabledRelationshipsCondition';

import './index.scss';

const baseClass = 'relationship-rich-text-button';

const insertRelationship = (editor, { value, relationTo }) => {
  const text = { text: ' ' };

  const relationship = {
    type: 'relationship',
    value,
    relationTo,
    children: [
      text,
    ],
  };

  injectVoidElement(editor, relationship);

  ReactEditor.focus(editor);
};

type Props = {
  path: string
  enabledCollectionSlugs: string[]
}
const RelationshipButton: React.FC<Props> = ({ enabledCollectionSlugs }) => {
  const { t } = useTranslation('fields');
  const editor = useSlate();
  const [selectedCollectionSlug, setSelectedCollectionSlug] = useState(() => enabledCollectionSlugs[0]);
  const [
    ListDrawer,
    ListDrawerToggler,
    {
      closeDrawer,
      isDrawerOpen,
    },
  ] = useListDrawer({
    collectionSlugs: enabledCollectionSlugs,
    selectedCollection: selectedCollectionSlug,
  });

  const onSelect = useCallback(({ docID, collectionConfig }) => {
    insertRelationship(editor, {
      value: {
        id: docID,
      },
      relationTo: collectionConfig.slug,
    });
    closeDrawer();
  }, [editor, closeDrawer]);

  useEffect(() => {
    // always reset back to first option
    // TODO: this is not working, see the ListDrawer component
    setSelectedCollectionSlug(enabledCollectionSlugs[0]);
  }, [isDrawerOpen, enabledCollectionSlugs]);

  return (
    <Fragment>
      <ListDrawerToggler>
        <ElementButton
          className={baseClass}
          format="relationship"
          tooltip={t('addRelationship')}
          el="div"
          onClick={() => {
            // do nothing
          }}
        >
          <RelationshipIcon />
        </ElementButton>
      </ListDrawerToggler>
      <ListDrawer onSelect={onSelect} />
    </Fragment>
  );
};

export default (props: Props): React.ReactNode => {
  return (
    <EnabledRelationshipsCondition {...props}>
      <RelationshipButton {...props} />
    </EnabledRelationshipsCondition>
  );
};
