import React from 'react';
import { useTranslation } from 'react-i18next';
import NavigationPrompt from 'react-router-navigation-prompt';

import Button from '../../elements/Button';
import { useFormModified } from '../../forms/Form/context';
import MinimalTemplate from '../../templates/Minimal';
import { useAuth } from '../../utilities/Auth';
import './index.scss';

const modalSlug = 'leave-without-saving';

const LeaveWithoutSaving: React.FC = () => {
  const modified = useFormModified();
  const { user } = useAuth();
  const { t } = useTranslation('general');

  return (
    <NavigationPrompt when={Boolean(modified && user)}>
      {({ onCancel, onConfirm }) => (
        <div className={modalSlug}>
          <MinimalTemplate className={`${modalSlug}__template`}>
            <h1>{t('leaveWithoutSaving')}</h1>
            <p>{t('changesNotSaved')}</p>
            <Button
              buttonStyle="secondary"
              onClick={onCancel}
            >
              {t('stayOnThisPage')}
            </Button>
            <Button
              onClick={onConfirm}
            >
              {t('leaveAnyway')}
            </Button>
          </MinimalTemplate>
        </div>
      )}
    </NavigationPrompt>
  );
};

export default LeaveWithoutSaving;
