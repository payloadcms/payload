import React from 'react';
import PropTypes from 'prop-types';
import Section from '../../../layout/Section';
import RenderFields from '../../RenderFields';

const formatSubField = (subField) => {
  return subField;
};

const Repeater = (props) => {
  const { label, fields } = props;

  return (
    <div className="field-repeater">
      <Section heading={label}>
        <RenderFields
          fields={fields}
          formatter={formatSubField}
        />
      </Section>
    </div>
  );
};

Repeater.defaultProps = {
  label: '',
};

Repeater.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  label: PropTypes.string,
};

export default Repeater;
