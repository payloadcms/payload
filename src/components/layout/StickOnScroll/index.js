import React, { Component } from 'react';
import { connect } from 'react-redux';

import './index.css';

const mapStateToProps = state => ({
  scrollPos: state.common.scrollPos
});

class StickOnScroll extends Component {
  constructor(props) {
    super(props);

    this.state = {
      bounds: false,
      stuck: false
    };
  }

  componentDidMount() {
    this.setState({
      bounds: this.stick.getBoundingClientRect()
    });
  }

  componentDidUpdate(prevProps, prevState) {
    const newBounds = this.spacer.getBoundingClientRect();
    if (newBounds.top <= 0 && !prevState.stuck) {
      this.setState({
        stuck: true
      });
    }

    if (newBounds.top >= 0 && prevState.stuck) {
      this.setState({
        stuck: false
      });
    }
  }

  render() {
    return (
      <div className="stick-on-scroll">
        <div
          className={`stick${this.state.stuck ? ' stuck' : ''}`}
          ref={(el) => { this.stick = el; } }>
          <div className="wrap">
            {this.props.children}
          </div>
        </div>
        <div
          className="spacer"
          style={{ height: `${this.state.bounds.height}px` }}
          ref={(el) => { this.spacer = el; } }>
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps)(StickOnScroll);
