import React from 'react';
import { useHistory } from 'react-router-dom';
import { useModal, Modal } from '@faceless-ui/modal';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config';
import MinimalTemplate from '../../templates/Minimal';
import Button from '../../elements/Button';
import { Props } from './types';

import './index.scss';

const baseClass = 'stay-logged-in';

const modalSlug = 'stay-logged-in';

const StayLoggedInModal: React.FC<Props> = (props) => {
  const { refreshCookie } = props;
  const history = useHistory();
  const config = useConfig();
  const {
    routes: { admin },
    admin: {
      logoutRoute,
    },
  } = config;
  const { toggleModal } = useModal();
  const { t } = useTranslation('authentication');

  return (
    <Modal
      className={baseClass}
      slug="stay-logged-in"
    >
      <MinimalTemplate className={`${baseClass}__template`}>
        <h1>{t('stayLoggedIn')}</h1>
        <p>{t('youAreInactive')}</p>
        <div className={`${baseClass}__actions`}>
          <Button
            buttonStyle="secondary"
            onClick={() => {
              toggleModal(modalSlug);
              history.push(`${admin}${logoutRoute}`);
            }}
          >
            {t('logOut')}
          </Button>
          <Button onClick={() => {
            refreshCookie();
            toggleModal(modalSlug);
          }}
          >
            {t('stayLoggedIn')}
          </Button>
        </div>
      </MinimalTemplate>
    </Modal>
  );
};

export default StayLoggedInModal;
