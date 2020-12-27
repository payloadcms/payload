import React, { useEffect, useState, useRef } from 'react';
import Copy from '../../icons/Copy';
import Tooltip from '../Tooltip';
import { Props } from './types';

import './index.scss';

const baseClass = 'copy-to-clipboard';

const CopyToClipboard: React.FC<Props> = ({
  value,
  defaultMessage = 'copy',
  successMessage = 'copied',
}) => {
  const ref = useRef(null);
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (copied && !hovered) {
      setTimeout(() => {
        setCopied(false);
      }, 1500);
    }
  }, [copied, hovered]);

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
        <Tooltip>
          {copied && successMessage}
          {!copied && defaultMessage}
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
