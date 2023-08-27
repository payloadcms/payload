import React from 'react';
import NavigationPrompt from 'react-router-navigation-prompt';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../utilities/Auth/index.js';
import { useFormModified } from '../../forms/Form/context.js';
import MinimalTemplate from '../../templates/Minimal/index.js';
import Button from '../../elements/Button/index.js';

import './index.scss';

const modalSlug = 'leave-without-saving';

const NavigationPromptToUse = NavigationPrompt as any;

const LeaveWithoutSaving: React.FC = () => {
  const modified = useFormModified();
  const { user } = useAuth();
  const { t } = useTranslation('general');

  return (
    <NavigationPromptToUse when={Boolean(modified && user)}>
      {({ onConfirm, onCancel }) => (
        <div className={modalSlug}>
          <MinimalTemplate className={`${modalSlug}__template`}>
            <h1>{t('leaveWithoutSaving')}</h1>
            <p>{t('changesNotSaved')}</p>
            <Button
              onClick={onCancel}
              buttonStyle="secondary"
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
    </NavigationPromptToUse>
  );
};

export default LeaveWithoutSaving;
