import React from 'react';
import Button from '../../elements/Button';
import Meta from '../../utilities/Meta';
import Banner from '../../elements/Banner';
import MinimalTemplate from '../../templates/Minimal';
import X from '../../icons/X';

const Unlicensed: React.FC = () => (
  <MinimalTemplate className="unlicensed">
    <Meta
      title="Unlicensed"
      description="Unlicensed"
      keywords="Unlicensed, Payload, CMS"
    />
    <h2>Your Payload license is invalid</h2>
    <Banner
      type="error"
      alignIcon="left"
      icon={<X />}
    >
      Sorry, but your license appears to be invalid for the domain
      {' '}
      <strong>
        {window.location.hostname}
      </strong>
      .
    </Banner>
    <p>
      Don&apos;t worry&mdash;your Payload API is still accessible, but a valid license is required to use the Payload admin panel on a live domain. Your payment method may have expired, or your license may not be properly tied to this domain.
    </p>
    <p>You can manage your licenses, including changing the domain that the license is attached to, through the Payload website.</p>
    <br />
    <Button
      el="anchor"
      url="https://payloadcms.com/login"
    >
      Review your licenses
    </Button>
  </MinimalTemplate>
);

export default Unlicensed;
