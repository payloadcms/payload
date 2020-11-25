import React from 'react';
import NavigationPrompt from 'react-router-navigation-prompt';
import { useAuth } from '@payloadcms/config-provider';
import { useFormModified } from '../../forms/Form/context';
import MinimalTemplate from '../../templates/Minimal';
import Button from '../../elements/Button';

import './index.scss';

const modalSlug = 'leave-without-saving';

const LeaveWithoutSaving: React.FC = () => {
  const modified = useFormModified();
  const { user } = useAuth();

  return (
    <NavigationPrompt when={Boolean(modified && user)}>
      {({ onConfirm, onCancel }) => (
        <div className={modalSlug}>
          <MinimalTemplate>
            <h1>Leave without saving</h1>
            <p>Your changes have not been saved. If you leave now, you will lose your changes.</p>
            <Button
              onClick={onCancel}
              buttonStyle="secondary"
            >
              Stay on this page
            </Button>
            <Button
              onClick={onConfirm}
            >
              Leave anyway
            </Button>
          </MinimalTemplate>
        </div>
      )}
    </NavigationPrompt>
  );
};

export default LeaveWithoutSaving;
