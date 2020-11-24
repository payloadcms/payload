import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { useConfig } from '@payloadcms/config-provider';
import Button from '../Button';
import { useForm } from '../../forms/Form/context';

import './index.scss';

const baseClass = 'duplicate';

const Duplicate = ({ slug }) => {
  const { push } = useHistory();
  const { getData } = useForm();
  const { routes: { admin } } = useConfig();

  const handleClick = useCallback(() => {
    const data = getData();

    push({
      pathname: `${admin}/collections/${slug}/create`,
      state: {
        data,
      },
    });
  }, [push, getData, slug, admin]);

  return (
    <Button
      buttonStyle="none"
      className={baseClass}
      onClick={handleClick}
    >
      Duplicate
    </Button>
  );
};

Duplicate.propTypes = {
  slug: PropTypes.string.isRequired,
};

export default Duplicate;
