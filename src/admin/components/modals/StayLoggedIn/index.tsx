import React from 'react';
import { useHistory } from 'react-router-dom';
import { useModal, Modal } from '@faceless-ui/modal';
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
      logoutRoute
    }
  } = config;
  const { toggleModal } = useModal();

  return (
    <Modal
      className={baseClass}
      slug="stay-logged-in"
    >
      <MinimalTemplate className={`${baseClass}__template`}>
        <h1>Stay logged in</h1>
        <p>You haven&apos;t been active in a little while and will shortly be automatically logged out for your own security. Would you like to stay logged in?</p>
        <div className={`${baseClass}__actions`}>
          <Button
            buttonStyle="secondary"
            onClick={() => {
              toggleModal(modalSlug);
              history.push(`${admin}${logoutRoute}`);
            }}
          >
            Log out
          </Button>
          <Button onClick={() => {
            refreshCookie();
            toggleModal(modalSlug);
          }}
          >
            Stay logged in
          </Button>
        </div>
      </MinimalTemplate>
    </Modal>
  );
};

export default StayLoggedInModal;
