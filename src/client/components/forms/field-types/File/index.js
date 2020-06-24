import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../elements/Button';
import FileDetails from '../../../elements/FileDetails';

import './index.scss';

const baseClass = 'file-field';

const File = (props) => {
  const inputRef = useRef(null);
  const [selectingFile, setSelectingFile] = useState(false);
  const { initialData = {} } = props;
  const { filename } = initialData;

  useEffect(() => {
    if (selectingFile) {
      inputRef.current.click();
      setSelectingFile(false);
    }
  }, [selectingFile, inputRef, setSelectingFile]);

  return (
    <div className={baseClass}>
      {filename && (
        <FileDetails {...initialData} />
      )}
      {!filename && (
        <div className={`${baseClass}__upload`}>
          <div className={`${baseClass}__drop-zone`}>
            <Button
              size="small"
              buttonStyle="secondary"
              onClick={() => setSelectingFile(true)}
            >
              Select a file
            </Button>
            <div>or drag and drop a file here</div>
          </div>
          <input
            ref={inputRef}
            type="file"
          />
        </div>
      )}
    </div>
  );
};

File.defaultProps = {
  initialData: undefined,
};

File.propTypes = {
  fieldTypes: PropTypes.shape({}).isRequired,
  initialData: PropTypes.shape({
    filename: PropTypes.string,
    mimeType: PropTypes.string,
    filesize: PropTypes.number,
  }),
};

export default File;
