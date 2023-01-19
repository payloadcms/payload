import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Copy from '../../icons/Copy';
import Tooltip from '../Tooltip';
import { Props } from './types';

import './index.scss';

const baseClass = 'copy-to-clipboard';

const CopyToClipboard: React.FC<Props> = ({
  value,
  defaultMessage,
  successMessage,
}) => {
  const ref = useRef(null);
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { t } = useTranslation('general');

  if (value) {
    return (
      <button
        onMouseEnter={() => {
          setHovered(true);
          setCopied(false);
        }}
        onMouseLeave={() => {
          setHovered(false);
          setCopied(false);
        }}
        type="button"
        className={baseClass}
        onClick={() => {
          if (ref && ref.current) {
            ref.current.select();
            ref.current.setSelectionRange(0, value.length + 1);
            document.execCommand('copy');
            setCopied(true);
          }
        }}
      >
        <Copy />
        <Tooltip
          show={hovered || copied}
          delay={copied ? 0 : undefined}
        >
          {copied && (successMessage ?? t('copied'))}
          {!copied && (defaultMessage ?? t('copy'))}
        </Tooltip>
        <textarea
          readOnly
          value={value}
          ref={ref}
        />
      </button>
    );
  }

  return null;
};

export default CopyToClipboard;
