import React, { Component } from 'react';
import { Link } from 'react-router-dom';
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
        key: '_id',
        label: 'ID'
      }, {
        key: 'published',
        label: 'Published On'
      }]
    }
  }

  structureRows = () => {
    if (this.props.data) {
      return this.props.data.map(row => {
        const formattedRow = { ...row };

        const url = `/collections/${this.props.collection.slug}/${row._id}`;

        // Link the first column
        formattedRow[this.state.columns[0].key] = <Link to={url}>{row[this.state.columns[0].key]}</Link>
        return formattedRow;
      })
    }

    return [];
  }

  componentDidUpdate(prevProps) {
    if (prevProps.data !== this.props.data) {
      this.setState({
        rows: this.structureRows(this.props.data)
      })
    }
  }

  render() {

    return (
      <React.Fragment>
        <Filter />
        <Table rows={this.state.rows} columns={this.state.columns} />
      </React.Fragment>
    )
  }
}

export default SearchableTable;
