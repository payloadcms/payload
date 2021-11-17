/* eslint-disable no-use-before-define */
/* eslint-disable import/no-extraneous-dependencies */
// import { Button } from 'payload/components';
import { useForm, useWatchForm } from 'payload/components/forms';
// import { FormContext } from 'payload/dist/admin/components/forms/Form/context';
import React, { useCallback, useState, useEffect } from 'react';
import { defaults } from '../defaults';

const {
  title: {
    minLength: minTitle,
    maxLength: maxTitle,
  },
  description: {
    minLength: minDesc,
    maxLength: maxDesc,
  },
} = defaults;

export const Overview: React.FC = () => {
  const {
    dispatchFields,
    getFields,
  } = useForm();

  const {
    fields: {
      'meta.title': {
        value: metaTitle,
      },
      'meta.description': {
        value: metaDesc,
      },
      'meta.image': {
        value: metaImage,
      },
    },
  } = useWatchForm();

  const [titleIsValid, setTitleIsValid] = useState<boolean | undefined>();
  const [descIsValid, setDescIsValid] = useState<boolean | undefined>();
  const [imageIsValid, setImageIsValid] = useState<boolean | undefined>();

  const resetAll = useCallback(() => {
    const fields = getFields();
    const fieldsWithoutMeta = fields;
    fieldsWithoutMeta['meta.title'].value = '';
    fieldsWithoutMeta['meta.description'].value = '';
    fieldsWithoutMeta['meta.image'].value = '';
    dispatchFields(fieldsWithoutMeta);
  }, [
    dispatchFields,
    getFields,
  ]);

  useEffect(() => {
    if (typeof metaTitle === 'string') setTitleIsValid(metaTitle.length >= minTitle && metaTitle.length <= maxTitle);
    if (typeof metaDesc === 'string') setDescIsValid(metaDesc.length >= minDesc && metaDesc.length <= maxDesc);
    setImageIsValid(Boolean(metaImage));
  }, [
    metaTitle,
    metaDesc,
    metaImage,
  ]);

  const testResults = [
    titleIsValid,
    descIsValid,
    imageIsValid,
  ];

  const numberOfPasses = testResults.filter(Boolean).length;

  return (
    <div
      style={{
        marginBottom: '20px',
      }}
    >
      <div>
        {`${numberOfPasses}/${testResults.length} checks are passing`}
      </div>
    </div>
  );
};
