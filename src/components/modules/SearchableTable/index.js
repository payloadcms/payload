import React, { Component } from 'react';
import { Filter, Table } from 'payload/components'
import { getPropSubset } from 'payload/utils';

class SearchableTable extends Component {

  constructor(props) {
    super(props);

    this.state = {
      rows: this.structureRows(this.props.data),
      columns: [{
        key: 'title',
        label: 'Title'
      }, {
        key: 'content',
        label: 'Content'
      }]
    }
  }

  structureRows(data, columns) {
      if (data) {
        return data.map(row => {

          if (columns) {
            const columnKeys = columns.map(col => col.key);
            return getPropSubset(columnKeys, row);
          }

          return {};
        })
      }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.data !== this.props.data) {
      this.setState({
        rows: this.structureRows(this.props.data, this.state.columns)
      });
    }
  }

  render() {
    return (
      <React.Fragment>
        <Filter />
        <Table rows={this.state.rows} />
      </React.Fragment>
    )
  }
}

export default SearchableTable;
