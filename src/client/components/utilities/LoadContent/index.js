import { Component } from 'react';
import { connect } from 'react-redux';
import collections from 'local/collections';

const mapDispatchToProps = dispatch => ({
  loadCollections: collections => dispatch({ type: 'LOAD_COLLECTIONS', payload: collections }),
});

class LoadContent extends Component {

  componentDidMount() {
    this.props.loadCollections(collections);
  }

  render() {
    return false;
  }
}

export default connect(null, mapDispatchToProps)(LoadContent);
