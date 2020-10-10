import { useContext } from 'react';
import Context from './context';

const useConfig = () => useContext(Context);

export default useConfig;
