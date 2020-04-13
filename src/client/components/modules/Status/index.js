import React, {
  useReducer, createContext, useContext, useEffect, useCallback,
} from 'react';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import Close from '../../graphics/Close';

import './index.scss';

const baseClass = 'status-list';

const Context = createContext({});

const initialStatus = [];

const statusReducer = (state, action) => {
  switch (action.type) {
    case 'ADD':
      return [
        ...state,
        action.payload,
      ];

    case 'REMOVE': {
      const statusList = [...state];
      statusList.splice(action.payload, 1);
      return statusList;
    }

    default:
      return state;
  }
};

const useStatusList = () => useContext(Context);

const HandleLocationStatus = () => {
  const { state } = useLocation();
  const { addStatus } = useStatusList();

  useEffect(() => {
    if (state && state.status) {
      if (Array.isArray(state.status)) {
        state.status.forEach(individualStatus => addStatus(individualStatus));
      } else {
        addStatus(state.status);
      }
    }
  }, [addStatus, state]);

  return null;
};

const StatusListProvider = ({ children }) => {
  const [statusList, dispatchStatus] = useReducer(statusReducer, initialStatus);

  const removeStatus = useCallback(i => dispatchStatus({ type: 'REMOVE', payload: i }), []);
  const addStatus = useCallback(status => dispatchStatus({ type: 'ADD', payload: status }), []);

  return (
    <Context.Provider value={{
      statusList,
      removeStatus,
      addStatus,
    }}
    >
      {children}
      <HandleLocationStatus />
    </Context.Provider>
  );
};

StatusListProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};

const StatusList = () => {
  const { statusList, removeStatus } = useStatusList();

  if (statusList.length > 0) {
    return (
      <ul className={baseClass}>
        {statusList.map((status, i) => {
          const classes = [
            `${baseClass}__status`,
            `${baseClass}__status--${status.type}`,
          ].join(' ');

          return (
            <li
              className={classes}
              key={i}
            >
              {status.message}
              <button
                type="button"
                className="close"
                onClick={(e) => {
                  e.preventDefault();
                  removeStatus(i);
                }}
              >
                <Close />
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  return null;
};

export {
  StatusListProvider,
  useStatusList,
  HandleLocationStatus,
};

export default StatusList;
