import React from "react";
import { useKVDux } from "react-kvdux";
import { useOwnDir } from "react-folder";

export const useRecordFolder = ({ folder, notify }) => {
  const store = useKVDux();
  const cursor = useOwnDir(folder);
  const ref = React.useRef(null);
  const path = String(cursor);

  ref.current = ref.current || { store, path };
  ref.current.store = store;
  ref.current.path = path;

  React.useEffect(() => () => {
    if (path) {
      const next = ref.current;
      next.store.create(next.path, () => store.read(path, null));
      store.update(path, null); // delete
    }
  }, [path, store]);

  return {
    record: path ? store.post(path, REDUCER, INIT_FN) : undefined,
    store,
    notify: notify || kvd.update,
    folder: cursor
  };
};
