import React from 'react';
import { useConfig } from '@payloadcms/config-provider';
import { Props } from './types';
import FileGraphic from '../../graphics/File';
import getThumbnail from '../../../../uploads/getThumbnail';

import './index.scss';

const baseClass = 'thumbnail';

const Thumbnail: React.FC<Props> = (props) => {
  const {
    doc,
    doc: {
      filename,
    },
    collection,
    size,
  } = props;

  const { serverURL } = useConfig();

  const thumbnail = getThumbnail(collection, doc);

  const classes = [
    baseClass,
    `${baseClass}--size-${size || 'medium'}`,
  ].join(' ');

  return (
    <div className={classes}>
      {thumbnail && (
        <img
          src={`${serverURL}${thumbnail}`}
          alt={filename as string}
        />
      )}
      {!thumbnail && (
        <FileGraphic />
      )}
    </div>
  );
};
export default Thumbnail;
