import React from 'react';
import { connect } from 'react-redux';
import { Close } from 'payload/components';

import './index.scss';

const mapState = state => ({
  status: state.common.status
})

const mapDispatch = dispatch => ({
  addStatus: status => dispatch({ type: 'ADD_STATUS', payload: status }),
  removeStatus: i => dispatch({ type: 'REMOVE_STATUS', payload: i })
})

const Status = props => {
  if (props.status.length > 0) {
    return (
      <ul className="status">
        {props.status.map((status, i) => {
          return (
            <li className={status.type} key={i}>
              {status.message}
              <button className="close" onClick={e => {
                e.preventDefault();
                props.removeStatus(i)
              }}>
                <Close />
              </button>
            </li>
          )
        })}
      </ul>
    )
  }

  return null;
}

export default connect(mapState, mapDispatch)(Status);
