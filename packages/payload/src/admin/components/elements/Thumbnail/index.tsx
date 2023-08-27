import React from 'react';
import { Props } from './types.js';
import FileGraphic from '../../graphics/File.js';
import useThumbnail from '../../../hooks/useThumbnail.js';

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
    className = '',
  } = props;

  const thumbnailSRC = useThumbnail(collection, doc);

  const classes = [
    baseClass,
    `${baseClass}--size-${size || 'medium'}`,
    className,
  ].join(' ');

  return (
    <div className={classes}>
      {thumbnailSRC && (
        <img
          src={thumbnailSRC}
          alt={filename as string}
        />
      )}
      {!thumbnailSRC && (
        <FileGraphic />
      )}
    </div>
  );
};
export default Thumbnail;
