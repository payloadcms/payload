import React, { useEffect } from 'react';
import {
  Redirect,
} from 'react-router-dom';
import { useStatusList } from '../../elements/Status';

const { routes: { admin } } = PAYLOAD_CONFIG;

const RedirectToLogin = () => {
  const { addStatus } = useStatusList();

  useEffect(() => {
    addStatus({
      message: 'You need to log in to be able to do that.',
      type: 'error',
    });
  }, [addStatus]);

  return (
    <Redirect to={`${admin}/login`} />
  );
};

export default RedirectToLogin;
