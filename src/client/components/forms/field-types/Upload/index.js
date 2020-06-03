import React, { Component } from 'react';
import useFieldType from '../../useFieldType';
import withCondition from '../../withCondition';
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
          id={this.props.id ? this.props.id : this.props.path}
          name={this.props.path}
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

export default withCondition(fieldType(Media, 'media', validate, error));
