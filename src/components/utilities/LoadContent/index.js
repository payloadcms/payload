import { Component } from 'react';
import { connect } from 'react-redux';
import Page from 'local/Page/Page.config';
import Order from 'local/Order/Order.config';

const collections = [
  Page,
  Order
];

const mapDispatchToProps = dispatch => ({
  loadCollections: data => dispatch({ type: 'LOAD_COLLECTIONS', payload: data }),
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
