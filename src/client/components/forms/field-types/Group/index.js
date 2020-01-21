import React from 'react';
import PropTypes from 'prop-types';
import Section from '../../../layout/Section';
import RenderFields from '../../RenderFields';

const Group = ({ label, fields }) => {
  return (
    <Section
      heading={label}
      className="field-group"
    >
      <RenderFields fields={fields} />
    </Section>
  );
};

Group.defaultProps = {
  label: '',
};

Group.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  label: PropTypes.string,
};

export default Group;
