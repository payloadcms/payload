import React, { Component } from 'react';
import { Filter, Table } from 'payload/components'

class SearchableTable extends Component {

  constructor(props) {
    super(props);

    this.state = {
      rows: this.structureRows(this.props.data),
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

  structureRows = () => {
    if (this.props.data) {
      return this.props.data.map(row => {
         if (columns) {
          const columnKeys = this.state.columns.map(col => col.key);
          return getPropSubset(columnKeys, row);
        }
         return {};
      })
    }

    return [];
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
