import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import Copy from '../../icons/Copy';
import Tooltip from '../Tooltip';

import './index.scss';

const baseClass = 'copy-to-clipboard';

const CopyToClipboard = ({ value, defaultMessage, successMessage }) => {
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

CopyToClipboard.defaultProps = {
  value: '',
  defaultMessage: 'Copy',
  successMessage: 'Copied',
};

CopyToClipboard.propTypes = {
  value: PropTypes.string,
  defaultMessage: PropTypes.string,
  successMessage: PropTypes.string,
};

export default CopyToClipboard;
