import React, { Component } from 'react';
import { Filter, Table } from 'payload/components'

class SearchableTable extends Component {

  constructor(props) {
    super(props);

    this.state = {
      columns: [{
        key: 'title',
        label: 'Title'
      }, {
        key: 'status',
        label: 'Status'
      }, {
        key: 'published',
        label: 'Published On'
      }]
    }
  }

  render() {

    return (
      <React.Fragment>
        <Filter />
        <Table rows={this.props.data} columns={this.state.columns} />
      </React.Fragment>
    )
  }
}

export default SearchableTable;
