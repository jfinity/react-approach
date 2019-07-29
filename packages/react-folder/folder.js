import React from "react";
import { pathfinder } from "slash-pathfinder";

const Storage = React.createContext({ stats: new Map() });

export const Volume = props => {
  const { children } = props;
  const [value] = React.useState({ stats: new Map() });

  return <Storage.Provider value={value}>{children}</Storage.Provider>;
};

const noop = () => {};

const root = pathfinder("", false, null, null);

export const useDir = (folder, warn) => {
  const { stats } = React.useContext(Storage);
  const cursor = React.useMemo(() => {
    return typeof folder === "string"
      ? (folder && pathfinder(folder, false, null, null)) || root
      : folder(false); // !temporary
  }, [folder]);
  const path = cursor();

  const ref = React.useRef(warn);
  ref.current = warn || noop;
  if (process.env.NODE_ENV === "development") {
    ref.current = warn || console.warn;
  }

  React.useEffect(() => {
    const before = path ? 0 | stats.get(path) : 0;

    if (path === "") {
      return undefined;
    }

    stats.set(path, before + 1);
    if (before !== 0) {
      ref.current("Unexpected folder attachment(s): " + path + " : " + before);
    }

    return () => {
      const after = 0 | stats.get(path);

      if (after === 1) {
        stats.delete(path);
      } else {
        stats.set(path, after - 1);
        ref.current("Unexpected folder detachment(s): " + path + " : " + after);
      }
    };
  }, [path]);

  React.useEffect(() => () => cursor("/"), [cursor]);

  return cursor;
};

const Finder = React.createContext(root);

export const usePathfinder = (rel = ".", path = null, Context = Finder) => {
  const finder = React.useContext(Context);
  const cursor =
    typeof path === "string"
      ? pathfinder(path, true, null, null)
      : path || finder;

  return cursor(String(rel) || ".");
};

export const Folder = props => {
  const { children, path, rel = ".", warn, Context = Finder } = props;
  const ownExclusively = rel !== "." && rel !== "";
  const temp = usePathfinder(rel, path, Context);
  const folder = useDir(ownExclusively ? temp : root, warn);
  const node = typeof children === "function" ? children(folder) : children;

  return (
    <Context.Provider value={folder}>
      {ownExclusively ? <Volume>{node}</Volume> : node}
    </Context.Provider>
  );
};
