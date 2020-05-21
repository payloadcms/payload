import React, { Component } from 'react';
import useFieldType from '../../useFieldType';
import withConditions from '../../withConditions';
import UploadMedia from '../../../modules/UploadMedia';

import './index.scss';

const defaultError = 'There was a problem uploading your file.';

const defaultValidate = () => true;

class Media extends Component {
  constructor(props) {
    super(props);

    this.state = {
      file: this.props.initialValue,
    };

    this.inputRef = React.createRef();
  }

  handleDrop = (file) => {
    this.inputRef.current.files = file;
  }

  handleSelectFile = () => {
    this.inputRef.current.click();
  }

  render() {
    return (
      <div
        className={this.props.className}
        style={{
          width: this.props.width ? `${this.props.width}%` : null,
          ...this.props.style,
        }}
      >
        {this.props.label}
        <input
          style={{ display: 'none' }}
          ref={this.inputRef}
          value={this.props.value || ''}
          onChange={this.props.onChange}
          type="hidden"
          id={this.props.id ? this.props.id : this.props.name}
          name={this.props.name}
        />
        {!this.props.value
          && (
            <UploadMedia
              handleDrop={this.handleDrop}
              handleSelectFile={this.handleSelectFile}
            />
          )
        }
      </div>
    );
  }
}

export default withConditions(fieldType(Media, 'media', validate, error));
