/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Props } from './types';
import Thumbnail from '../Thumbnail';

import './index.scss';

const baseClass = 'upload-card';

const UploadCard: React.FC<Props> = (props) => {
  const {
    className,
    onClick,
    doc,
    collection,
  } = props;

  const { t } = useTranslation('general');

  const classes = [
    baseClass,
    className,
    typeof onClick === 'function' && `${baseClass}--has-on-click`,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      onClick={typeof onClick === 'function' ? onClick : undefined}
    >
      <Thumbnail
        size="expand"
        doc={doc}
        collection={collection}
      />
      <div className={`${baseClass}__filename`}>
        {typeof doc?.filename === 'string' ? doc?.filename : `[${t('untitled')}]`}
      </div>
    </div>
  );
};

export default UploadCard;
