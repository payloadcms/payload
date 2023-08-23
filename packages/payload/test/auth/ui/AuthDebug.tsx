import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../src/admin/components/utilities/Auth';
import { UIField } from '../../../src/fields/config/types';
import { User } from '../../../src/auth';

export const AuthDebug: React.FC<UIField> = () => {
  const [state, setState] = useState<User | null | undefined>();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetch(`/api/users/${user.id}`).then((r) => r.json()).then((newUser) => {
        setState(newUser);
      });
    }
  }, [user]);

  return (
    <div id="auth-debug-ui-field">
      <div id="users-api-result">
        {state?.custom as string}
      </div>
      <div id="use-auth-result">
        {user?.custom as string}
      </div>
    </div>
  );
};
