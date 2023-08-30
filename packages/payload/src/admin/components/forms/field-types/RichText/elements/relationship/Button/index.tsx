import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReactEditor, useSlate } from 'slate-react';

import { useListDrawer } from '../../../../../../elements/ListDrawer/index.js';
import RelationshipIcon from '../../../../../../icons/Relationship/index.js';
import ElementButton from '../../Button.js';
import { EnabledRelationshipsCondition } from '../../EnabledRelationshipsCondition.js';
import { injectVoidElement } from '../../injectVoid.js';
import './index.scss';

const baseClass = 'relationship-rich-text-button';

const insertRelationship = (editor, { relationTo, value }) => {
  const text = { text: ' ' };

  const relationship = {
    children: [
      text,
    ],
    relationTo,
    type: 'relationship',
    value,
  };

  injectVoidElement(editor, relationship);

  ReactEditor.focus(editor);
};

type Props = {
  enabledCollectionSlugs: string[]
  path: string
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

  const onSelect = useCallback(({ collectionConfig, docID }) => {
    insertRelationship(editor, {
      relationTo: collectionConfig.slug,
      value: {
        id: docID,
      },
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
          onClick={() => {
            // do nothing
          }}
          className={baseClass}
          el="div"
          format="relationship"
          tooltip={t('addRelationship')}
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
