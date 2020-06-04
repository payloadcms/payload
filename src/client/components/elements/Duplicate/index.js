import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import config from 'payload/config';
import useForm from '../../forms/Form/useForm';

import './index.scss';

const { routes: { admin } } = config;

const baseClass = 'duplicate';

const Duplicate = ({ slug }) => {
  const { getData } = useForm();
  const data = getData();

  return (
    <Link
      className={baseClass}
      to={{
        pathname: `${admin}/collections/${slug}/create`,
        state: {
          data,
        },
      }}
    >
      Duplicate
    </Link>
  );
};

Duplicate.propTypes = {
  slug: PropTypes.string.isRequired,
};

export default Duplicate;
