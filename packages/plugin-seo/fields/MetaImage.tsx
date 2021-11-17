/* eslint-disable no-use-before-define */
/* eslint-disable import/no-extraneous-dependencies */
import React, { useCallback } from 'react';
import { Props as UploadFieldType } from 'payload/dist/admin/components/forms/field-types/Upload/types';
import { useFieldType, useWatchForm } from 'payload/components/forms';
import { FieldType as UseFieldType, Options } from 'payload/dist/admin/components/forms/useFieldType/types';
import Upload from 'payload/dist/admin/components/forms/field-types/Upload';
import { generateMetaImage } from '../utilities/generateMetaImage';
import { Pill } from '../ui/Pill';

export const MetaImage: React.FC<UploadFieldType> = (props) => {
  const {
    label,
  } = props;

  const field: UseFieldType<string> = useFieldType(props as Options);

  const { fields } = useWatchForm();

  const {
    value,
    setValue,
  } = field;

  const generate = useCallback(() => {
    const generatedImage = generateMetaImage(fields);
    setValue(generatedImage);
  }, [
    fields,
    setValue,
  ]);

  const hasImage = Boolean(value);

  return (
    <div
      style={{
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          marginBottom: '5px',
          position: 'relative',
        }}
      >
        <div>
          {label}
          &nbsp;
          &mdash;
          &nbsp;
          <button
            onClick={generate}
            type="button"
            style={{
              padding: 0,
              background: 'none',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Auto-generate
          </button>
        </div>
        <div
          style={{
            color: '#9A9A9A',
          }}
        >
          Auto-generation will retrieve the selected hero image.
        </div>
      </div>
      <div
        style={{
          position: 'relative',
          // marginBottom: '10px',
        }}
      >
        <Upload
          {...props}
          label={null}
        // style={{
        //   marginBottom: '0px',
        // }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <Pill
          backgroundColor={hasImage ? 'green' : 'red'}
          color="white"
          label={hasImage ? 'Good' : 'No Image'}
        />
      </div>
    </div>
  );
};
