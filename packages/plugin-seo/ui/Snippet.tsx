/* eslint-disable no-use-before-define */
/* eslint-disable import/no-extraneous-dependencies */
import { useWatchForm } from 'payload/components/forms';
import React from 'react';

export const Snippet: React.FC = () => {
  const { fields } = useWatchForm();

  const {
    'meta.title': {
      value: metaTitle,
    },
    'meta.description': {
      value: metaDescription,
    },
  } = fields;

  return (
    <div>
      <div
        style={{
          marginBottom: '5px',
        }}
      >
        Snippet
      </div>
      <div
        style={{
          padding: '20px',
          borderRadius: '5px',
          boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
          pointerEvents: 'none',
        }}
      >
        <h4
          style={{
            margin: 0,
          }}
        >
          <a
            href="/"
            style={{
              color: '-webkit-link',
              textDecoration: 'none',
            }}
          >
            {metaTitle}
          </a>
        </h4>
        <div>
          <a
            href="/"
            style={{
              color: '-webkit-link',
              textDecoration: 'none',
            }}
          >
            https://...
          </a>
        </div>
        <p
          style={{
            margin: 0,
          }}
        >
          {metaDescription}
        </p>
      </div>
    </div>
  );
};
