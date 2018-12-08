import React, { Component } from 'react';
import { Close } from 'payload/components';

import './index.scss';

class Status extends Component {
  constructor(props) {
    super(props);

    this.state = {
      open: this.props.open
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.open !== this.props.open) {
      this.setState({
        open: this.props.open
      })
    }
  }

  render() {
    if (this.state.open) {
      return (
        <div className={`status ${this.props.type}`}>
          {this.props.message}
          <button className="close" onClick={() => this.setState({ open: false} )}>
            <Close />
          </button>
        </div>
      )
    }

    return null;
  }
}

export default Status;
