import React from 'react';
import { useWatchForm } from 'payload/components/forms';
import CopyToClipboard from 'payload/dist/admin/components/elements/CopyToClipboard';
import { UIField } from 'payload/dist/fields/config/types';
import { Fields } from 'payload/dist/admin/components/forms/Form/types';
// import { useDocumentInfo } from 'payload/components/utilities';

type FieldsWithStripeID = Fields & {
  stripeID: {
    value: string
  }
}

export const LinkToDoc: React.FC<UIField & {
  isTestKey: boolean
  stripeResourceType: string
}> = (props) => {
  const {
    isTestKey, // TODO: this is 'undefined'
    stripeResourceType
  } = props;

  const form = useWatchForm();
  const fields = form.fields as FieldsWithStripeID;

  const {
    stripeID: {
      value: stripeID
    } = {}
  } = fields;

  // TODO: 'isTestKey' is always 'undefined' here, see '../index.ts'
  // const stripeEnv = isTestKey ? 'test/' : '';
  // For now, we'll just hardcode it to 'test/'
  const stripeEnv = 'test/';
  const href = `https://dashboard.stripe.com/${stripeEnv}${stripeResourceType}/${stripeID}`

  return (
    <div>
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
