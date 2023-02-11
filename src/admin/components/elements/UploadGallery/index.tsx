import React from 'react';
import { Props } from './types';
import { ThumbnailCard } from '../ThumbnailCard';

import './index.scss';

const baseClass = 'upload-gallery';

const UploadGallery: React.FC<Props> = (props) => {
  const { docs, onCardClick, collection } = props;

  if (docs && docs.length > 0) {
    return (
      <ul className={baseClass}>
        {docs.map((doc) => (
          <li key={String(doc.id)}>
            <ThumbnailCard
              doc={doc}
              collection={collection}
              onClick={() => onCardClick(doc)}
            />
          </li>
        ))}
      </ul>
    );
  }

  return null;
};

export default UploadGallery;
