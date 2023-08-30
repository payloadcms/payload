import React from 'react';
import { useTranslation } from 'react-i18next';
import NavigationPrompt from 'react-router-navigation-prompt';

import Button from '../../elements/Button/index.js';
import { useFormModified } from '../../forms/Form/context.js';
import MinimalTemplate from '../../templates/Minimal/index.js';
import { useAuth } from '../../utilities/Auth/index.js';
import './index.scss';

const modalSlug = 'leave-without-saving';


const LeaveWithoutSaving: React.FC = () => {
  const modified = useFormModified();
  const { user } = useAuth();
  const { t } = useTranslation('general');
  const NavigationPromptToUse = 'default' in NavigationPrompt ? NavigationPrompt.default : NavigationPrompt;

  return (
    <NavigationPromptToUse when={Boolean(modified && user)}>
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
    </NavigationPromptToUse>
  );
};

export default LeaveWithoutSaving;
