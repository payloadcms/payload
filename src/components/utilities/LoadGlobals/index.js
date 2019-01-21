import { Component } from 'react';
import { connect } from 'react-redux';

const mapDispatch = dispatch => ({
  loadGlobals: globals => dispatch({ type: 'LOAD_GLOBALS', payload: globals })
})

class LoadGlobals extends Component {
  componentDidMount() {
    this.props.loadGlobals({
      config: this.props.config,
      collections: this.props.collections
    });
  }

  render() {
    return null;
  }
}

export default connect(null, mapDispatch)(LoadGlobals);
