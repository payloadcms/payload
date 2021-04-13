import React from 'react';
import { useAuth, useConfig } from '@payloadcms/config-provider';
import Button from '../../elements/Button';
import Meta from '../../utilities/Meta';
import Banner from '../../elements/Banner';
import MinimalTemplate from '../../templates/Minimal';
import X from '../../icons/X';

import './index.scss';

const baseClass = 'unauthorized-user';

const UnauthorizedUser: React.FC = () => {
  const { licensePlan, user } = useAuth();
  const {
    routes: {
      admin,
    },
  } = useConfig();

  return (
    <MinimalTemplate className={baseClass}>
      <Meta
        title="Unauthorized User"
        description="Unauthorized User"
        keywords="Unauthorized, Payload, CMS"
      />
      <h2>Your user account is unauthorized</h2>
      <Banner
        type="error"
        alignIcon="left"
        icon={<X />}
      >
        Sorry, the
        {' '}
        <strong className={`${baseClass}__plan-name`}>
          {licensePlan}
        </strong>
        {' '}
        license associated with this domain does not grant access to your email address (
        <strong>{user?.email}</strong>
        ).
      </Banner>
      <p>
        Don&apos;t worry&mdash;your Payload API is still accessible, but you can only access the Payload admin panel with user(s) that are specifically whitelisted by the owner of this Payload license.
      </p>
      <p>The user accounts that are granted access can be configured within the Payload CMS website. Contact the owner of the license to learn more.</p>
      <div className={`${baseClass}__button-group`}>
        <Button
          el="link"
          url={`${admin}/logout`}
        >
          Log out
        </Button>
        <Button
          el="anchor"
          url="https://payloadcms.com/login"
          buttonStyle="secondary"
          newTab
        >
          Go to the Payload CMS website
        </Button>
      </div>
    </MinimalTemplate>
  );
};

export default UnauthorizedUser;
