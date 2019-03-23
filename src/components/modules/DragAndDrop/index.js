import React, { Component } from 'react';
import { Button } from 'payload/components';

import './index.scss';

class DragAndDrop extends Component {

  constructor() {
    super();

    this.state = {
      dragging: false
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
      this.props.handleDrop(e.dataTransfer.files)
      e.dataTransfer.clearData()
      this.dragCounter = 0
    }
  }

  onSelectFile = e => {
    e.preventDefault();
    e.stopPropagation();
    this.props.handleSelectFile();
  }

  render() {
    return (
      <div ref={this.dropRef} className={`drag-and-drop${this.state.dragging ? ' dragging' : ''}`}>
        <span className="instructions">Drag and drop a file here</span>
        <span className="or">&mdash;or&mdash;</span>
        <Button className="select-file" type="secondary" onClick={this.onSelectFile}>Select a File</Button>
      </div>
    )
  }
}

export default DragAndDrop;
