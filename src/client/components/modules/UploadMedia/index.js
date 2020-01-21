import React, { Component } from 'react';
import { createPortal } from 'react-dom';
import Button from '../../controls/Button';
import api from '../../../api';
import getSanitizedConfig from '../../../config/getSanitizedConfig';

import './index.scss';

const config = getSanitizedConfig();

class UploadMedia extends Component {

  constructor() {
    super();

    this.state = {
      dragging: false,
      selectingFile: false,
      files: null
    }

    this.dropRef = React.createRef();
    this.dragCounter = 0;
  }

  componentDidMount() {
    let div = this.dropRef.current
    div.addEventListener('dragenter', this.handleDragIn)
    div.addEventListener('dragleave', this.handleDragOut)
    div.addEventListener('dragover', this.handleDrag)
    div.addEventListener('drop', this.handleDrop)
  }

  componentWillUnmount() {
    let div = this.dropRef.current
    div.removeEventListener('dragenter', this.handleDragIn)
    div.removeEventListener('dragleave', this.handleDragOut)
    div.removeEventListener('dragover', this.handleDrag)
    div.removeEventListener('drop', this.handleDrop)
  }

  handleDrag = e => {
    e.preventDefault();
    e.stopPropagation();
  }

  handleDragIn = e => {
    e.preventDefault();
    e.stopPropagation();
    this.dragCounter++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      this.setState({ dragging: true })
    }
  }

  handleDragOut = e => {
    e.preventDefault();
    e.stopPropagation();
    this.dragCounter--;
    if (this.dragCounter > 0) return;
    this.setState({ dragging: false })
  }

  handleDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({ dragging: false })
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      this.setState({
        files: e.dataTransfer.files,
        dragging: false
      })

      e.dataTransfer.clearData();
      this.dragCounter = 0;
    } else {
      this.setState({ dragging: false })
    }
  }

  handleSelectFile = e => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({
      selectingFile: true
    })
  }

  setSelectingFile = selectingFile => {
    this.setState({ selectingFile })
  }

  render() {
    return (
      <div ref={this.dropRef} className={`upload-media${this.state.dragging ? ' dragging' : ''}`}>
        <span className="instructions">Drag and drop a file here</span>
        <span className="or">&mdash;or&mdash;</span>
        <Button className="select-file" type="secondary" onClick={this.handleSelectFile}>Select a File</Button>
        <UploadMediaForm files={this.state.files} selectingFile={this.state.selectingFile} config={config} setSelectingFile={this.setSelectingFile} />
      </div>
    )
  }
}

// Need to set up a separate component with a Portal
// to make sure forms are not embedded within other forms
class UploadMediaForm extends Component {

  constructor() {
    super();
    this.state = {
      submitted: false
    }
    this.formRef = React.createRef();
    this.inputRef = React.createRef();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.files !== this.props.files && this.props.files) {
      this.inputRef.current.files = this.props.files;
      this.handleSubmit();
    }

    if (prevProps.selectingFile !== this.props.selectingFile && this.props.selectingFile) {
      this.inputRef.current.click();
      this.props.setSelectingFile(false);
    }
  }

  componentDidMount() {
    this.inputRef.current.addEventListener('change', this.handleFormChange, false);
  }

  componentWillUnmount() {
    this.inputRef.current.removeEventListener('change', this.handleFormChange);
  }

  handleFormChange = (e) => {
    this.props.setSelectingFile(false);

    // If there are files, submit the form
    if (this.inputRef.current.files[0]) {
      this.handleSubmit();
    }
  }

  handleSubmit = () => {
    const data = new FormData(this.formRef.current);
    api.requests.post(`${this.props.config.serverURL}/upload`, data).then(
      res => console.log(res),
      err => {
        console.warn(err);
      }
    );
  }

  render() {
    return createPortal(
      <form ref={this.formRef}>
        <input type="file" name="files" ref={this.inputRef} />
      </form>,
      document.getElementById('portal'))
  }
}

export default UploadMedia;
