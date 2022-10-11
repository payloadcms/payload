import React from 'react';
import { useWatchForm } from 'payload/components/forms';
import { UIField } from 'payload/dist/fields/config/types';
import { Fields } from 'payload/dist/admin/components/forms/Form/types';
import CopyToClipboard from 'payload/dist/admin/components/elements/CopyToClipboard';

type FieldsWithStripeID = Fields & {
  stripeID: {
    value: string
  }
}

export const LinkToDoc: React.FC<UIField & {
  isTestKey: boolean
  stripeResourceType: string
  path: string
  nameOfIDField: string
}> = (props) => {
  const {
    isTestKey, // TODO: this is 'undefined'
    stripeResourceType,
    path,
    nameOfIDField
  } = props;

  const form = useWatchForm();
  const fields = form.fields as FieldsWithStripeID;

  const stripeID = fields[`${path}.${nameOfIDField}`]?.value;

  // TODO: 'isTestKey' is always 'undefined' here, see '../index.ts'
  // const stripeEnv = isTestKey ? 'test/' : '';
  // For now, we'll just hardcode it to 'test/'
  const stripeEnv = 'test/';
  const href = `https://dashboard.stripe.com/${stripeEnv}${stripeResourceType}/${stripeID}`

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div>
        <span
          className="label"
          style={{
            color: '#9A9A9A'
          }}
        >
          View in Stripe
        </span>
        <CopyToClipboard
          value={href as string}
        />
      </div>
      <div
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontWeight: '600'
        }}
      >
        <a
          href={href as string}
          target="_blank"
          rel="noreferrer noopener"
        >
          {href}
        </a>
      </div>
    </div >
  );
};

