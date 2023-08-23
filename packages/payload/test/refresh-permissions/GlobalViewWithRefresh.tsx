import React, { useCallback } from 'react';
import { useAuth } from '../../src/admin/components/utilities/Auth';
import { Props } from '../../src/admin/components/views/Global/types';
import DefaultGlobalView from '../../src/admin/components/views/Global/Default';

const GlobalView: React.FC<Props> = (props) => {
  const { onSave } = props;
  const { refreshPermissions } = useAuth();
  const modifiedOnSave = useCallback((...args) => {
    onSave.call(null, ...args);
    refreshPermissions();
  }, [onSave, refreshPermissions]);

  return (
    <DefaultGlobalView
      {...props}
      onSave={modifiedOnSave}
    />
  );
};

export default GlobalView;
