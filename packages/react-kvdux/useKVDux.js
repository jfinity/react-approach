import React from "react";
import { createKVStore } from "kvdux";

const Store = React.createContext(createKVStore());

const forceUpdate = version => 1 + (0 | version);

const useForceUpdate = () => React.useReducer(forceUpdate, 1)[1];

export const useKVDux = () => {
  const rerender = useForceUpdate();
  const store = React.useContext(Store);

  return Object.assign({}, store, {
    read: (key, notify = rerender) => store.read(key, notify)
  });
};

export const { Provider } = Store;
