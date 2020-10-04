import React from 'react';
import PropTypes from 'prop-types';
import ElementButton from '../Button';
import RelationshipIcon from '../../../../../icons/Relationship';
import plugin from './plugin';

const Relationship = ({ attributes, children }) => (
  <h4 {...attributes}>{children}</h4>
);

Relationship.defaultProps = {
  attributes: {},
  children: null,
};

Relationship.propTypes = {
  attributes: PropTypes.shape({}),
  children: PropTypes.node,
};

export default {
  Button: () => <ElementButton format="relationship"><RelationshipIcon /></ElementButton>,
  Element: Relationship,
  plugins: [
    plugin,
  ],
};
