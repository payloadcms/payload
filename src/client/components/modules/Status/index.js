import React, { useState, createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import Close from '../../forms/Submit/graphics/Close';

import './index.scss';

const Context = createContext({});

const StatusListProvider = ({ children }) => {
  const [statusList, setStatus] = useState([]);

  return (
    <Context.Provider value={{
      statusList,
      removeStatus: (i) => {
        const newStatusList = [...statusList];
        newStatusList.splice(i, 1);
        setStatus(newStatusList);
      },
      addStatus: status => [
        ...statusList,
        status,
      ],
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

const useStatusList = () => useContext(Context);

const StatusList = () => {
  const { statusList, removeStatus } = useStatusList();

  if (statusList.length > 0) {
    return (
      <ul className="status">
        {statusList.map((status, i) => {
          return (
            <li
              className={status.type}
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
  StatusList,
  useStatusList,
};

export default Context;
