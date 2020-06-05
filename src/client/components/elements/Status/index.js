import React, {
  useReducer, createContext, useContext, useEffect, useCallback,
} from 'react';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import X from '../../icons/X';

import './index.scss';

const baseClass = 'status-list';

const Context = createContext({});

const initialStatus = [];

const statusReducer = (state, action) => {
  switch (action.type) {
    case 'ADD': {
      const newState = [
        ...state,
        action.payload,
      ];

      return newState;
    }


    case 'REMOVE': {
      const statusList = [...state];
      statusList.splice(action.payload, 1);
      return statusList;
    }

    case 'CLEAR': {
      return [];
    }

    case 'REPLACE': {
      return action.payload;
    }

    default:
      return state;
  }
};

const useStatusList = () => useContext(Context);

const StatusListProvider = ({ children }) => {
  const [statusList, dispatchStatus] = useReducer(statusReducer, initialStatus);
  const { pathname, state } = useLocation();

  const removeStatus = useCallback(i => dispatchStatus({ type: 'REMOVE', payload: i }), []);
  const addStatus = useCallback(status => dispatchStatus({ type: 'ADD', payload: status }), []);
  const clearStatus = useCallback(() => dispatchStatus({ type: 'CLEAR' }), []);
  const replaceStatus = useCallback(status => dispatchStatus({ type: 'REPLACE', payload: status }), []);

  useEffect(() => {
    if (state && state.status) {
      if (Array.isArray(state.status)) {
        replaceStatus(state.status);
      } else {
        replaceStatus([state.status]);
      }
    } else {
      clearStatus();
    }
  }, [addStatus, replaceStatus, clearStatus, state, pathname]);

  return (
    <Context.Provider value={{
      statusList,
      removeStatus,
      addStatus,
      clearStatus,
      replaceStatus,
    }}
    >
      {children}
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
                <X />
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
};

export default StatusList;
