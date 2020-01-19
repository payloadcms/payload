import React from 'react';
import PropTypes from 'prop-types';
import Section from '../../../layout/Section';

const Group = ({ label, children }) => {
  return (
    <Section
      heading={label}
      className="field-group"
    >
      {children}
    </Section>
  );
};

Group.defaultProps = {
  label: '',
};

Group.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
  label: PropTypes.string,
};

export default Group;
