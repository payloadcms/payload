import React, { useState } from 'react';
import PropTypes from 'prop-types';
import FileGraphic from '../../../graphics/File';
import Button from '../../../elements/Button';
import useForm from '../../Form/useForm';

import './index.scss';

const baseClass = 'file-field';

const File = (props) => {
  const { initialData } = props;

  console.log(initialData);

  return (
    <div className={baseClass}>
      <FileGraphic />
    </div>
  );
};

File.defaultProps = {
  initialData: undefined,
};

File.propTypes = {
  fieldTypes: PropTypes.shape({}).isRequired,
  initialData: PropTypes.shape({}),
};

export default File;
