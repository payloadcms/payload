import { Component } from 'react';
import { connect } from 'react-redux';

const mapDispatch = dispatch => ({
  loadConfig: config => dispatch({ type: 'LOAD_CONFIG', payload: config })
})

class LoadGlobals extends Component {
  componentDidMount() {
    this.props.loadConfig(this.props.config);
  }

  render() {
    return null;
  }
}

export default connect(null, mapDispatch)(LoadGlobals);
