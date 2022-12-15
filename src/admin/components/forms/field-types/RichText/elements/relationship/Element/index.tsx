import React, { useState } from 'react';
import { useFocused, useSelected } from 'slate-react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../../../../../utilities/Config';
import RelationshipIcon from '../../../../../../icons/Relationship';
import usePayloadAPI from '../../../../../../../hooks/usePayloadAPI';
import { getTranslation } from '../../../../../../../../utilities/getTranslation';

import './index.scss';

const baseClass = 'rich-text-relationship';

const initialParams = {
  depth: 0,
};

const Element = (props) => {
  const { attributes, children, element } = props;
  const { relationTo, value } = element;
  const { collections, serverURL, routes: { api } } = useConfig();
  const [relatedCollection] = useState(() => collections.find((coll) => coll.slug === relationTo));
  const selected = useSelected();
  const focused = useFocused();
  const { t, i18n } = useTranslation('fields');

  const [{ data }] = usePayloadAPI(
    `${serverURL}${api}/${relatedCollection.slug}/${value?.id}`,
    { initialParams },
  );

  return (
    <div
      className={[
        baseClass,
        (selected && focused) && `${baseClass}--selected`,
      ].filter(Boolean).join(' ')}
      contentEditable={false}
      {...attributes}
    >
      <RelationshipIcon />
      <div className={`${baseClass}__wrap`}>
        <div className={`${baseClass}__label`}>
          {t('labelRelationship', { label: getTranslation(relatedCollection.labels.singular, i18n) })}
        </div>
        <h5>{data[relatedCollection?.admin?.useAsTitle || 'id']}</h5>
      </div>
      {children}
    </div>
  );
};

export default Element;
