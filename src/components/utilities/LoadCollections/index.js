import { Component } from 'react';
import { connect } from 'react-redux';

const mapDispatchToProps = dispatch => ({
  loadCollections: data => dispatch({ type: 'LOAD_COLLECTIONS', payload: data }),
});

class LoadCollections extends Component {

  componentDidMount() {
    this.props.loadCollections(this.props.collections);
  }

  render() {
    return false;
  }
}

export default connect(null, mapDispatchToProps)(LoadCollections);
