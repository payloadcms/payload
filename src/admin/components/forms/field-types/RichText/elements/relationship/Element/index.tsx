import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useConfig } from '@payloadcms/config-provider';
import RelationshipIcon from '../../../../../../icons/Relationship';

import './index.scss';

const baseClass = 'rich-text-relationship';

const Element = ({ attributes, children, element }) => {
  const { relationTo, value } = element;
  const { collections } = useConfig();
  const [relatedCollection] = useState(() => collections.find((coll) => coll.slug === relationTo));

  return (
    <div
      className={baseClass}
      contentEditable={false}
      {...attributes}
    >
      <RelationshipIcon />
      <div className={`${baseClass}__wrap`}>
        <div className={`${baseClass}__label`}>
          {relatedCollection.labels.singular}
          {' '}
          Relationship
        </div>
        <h5>{value[relatedCollection?.admin?.useAsTitle || 'id']}</h5>
      </div>
      {children}
    </div>
  );
};

Element.defaultProps = {
  attributes: {},
  children: null,
};

Element.propTypes = {
  attributes: PropTypes.shape({}),
  children: PropTypes.node,
  element: PropTypes.shape({
    value: PropTypes.shape({}),
    relationTo: PropTypes.string,
  }).isRequired,
};

export default Element;
