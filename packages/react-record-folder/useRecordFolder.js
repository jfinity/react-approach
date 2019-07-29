import React from "react";
import { useKVDux } from "react-kvdux";
import { useDir } from "react-folder";

export const useRecordFolder = ({ folder, notify }) => {
  const store = useKVDux();
  const cursor = useDir(folder);
  const path = String(cursor);

  React.useEffect(() => () => path && store.update(path, null), [path]); // delete

  return {
    record: path ? store.read(path) : undefined,
    store,
    notify: notify || kvd.update,
    folder: cursor
  };
};
