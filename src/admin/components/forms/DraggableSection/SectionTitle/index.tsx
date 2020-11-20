import React from 'react';
import PropTypes from 'prop-types';

import EditableBlockTitle from './EditableBlockTitle';
import Pill from '../../../elements/Pill';

import './index.scss';

const baseClass = 'section-title';

const SectionTitle = (props) => {
  const { label, ...remainingProps } = props;

  const classes = [
    baseClass,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <Pill pillStyle="light-gray">{label}</Pill>
      <EditableBlockTitle {...remainingProps} />
    </div>
  );
};

SectionTitle.defaultProps = {
  label: '',
};

SectionTitle.propTypes = {
  label: PropTypes.string,
};

export default SectionTitle;
