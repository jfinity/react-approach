import React from "react";
import { pathfinder } from "slash-pathfinder";

const isSafeStep = arg => arg !== null && arg !== undefined && !!String(arg);

const Storage = React.createContext({ stats: new Map() });

export const Volume = props => {
  const { children } = props;
  const [value] = React.useState({ stats: new Map() });

  return <Storage.Provider value={value}>{children}</Storage.Provider>;
};

const Device = React.createContext({});

export const Mount = props => {
  const { points, children } = props;
  const existing = React.useContext(Device);
  const value = Object.assign({}, points, existing);

  return <Device.Provider value={value}>{children}</Device.Provider>;
};

const echo = value => value;

const root = pathfinder("", false, null, null);

const allocPath = (() => {
  let monotonic = 1;
  return tmp => [tmp, "react-folder", monotonic++];
})();

export const useOwnDir = (folder, warn = echo) => {
  const ref = React.useRef(warn);
  ref.current = typeof warn === "function" ? warn : echo;
  if (warn === true || process.env.NODE_ENV === "development") {
    ref.current = ref.current || console.warn;
  }

  const { tmp } = React.useContext(Mount);
  const loc = String(tmp || "tmp").slice(
    String(tmp || "tmp").charCodeAt("/") === "/".charCodeAt(0) ? 1 : 0
  );
  const [unique] = React.useReducer(echo, allocPath, loc);
  if (loc !== unique[0]) {
    ref.current("Unexpected mismatched tmp mount: " + loc + " : " + unique[0]);
    unique[0] = loc;
  }

  const { stats } = React.useContext(Storage);
  const cursor = React.useMemo(() => {
    let branch = typeof folder === "function" ? folder : root;
    if (isSafeStep(folder)) {
      branch = root(folder).finder;
    }
    return String(branch) ? branch : root(unique).finder;
  }, [].concat(unique, folder));
  const path = String(cursor);

  React.useEffect(() => {
    const before = 0 | stats.get(path);
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
  }, [path, stats]);

  React.useEffect(() => () => cursor("/").finder, [cursor]);

  return cursor;
};

const Cursor = React.createContext(root);

export const usePathStep = (rel = ".", abs = null, Context = Cursor) => {
  const cursor = React.useContext(Context);
  const next = isSafeStep(rel) ? rel : ".";
  if (abs === null) {
    return cursor(next);
  } else if (typeof abs === "function") {
    return abs(next);
  } else if (isSafeStep(abs)) {
    return root(abs, next);
  }
  return root(next);
};

export const Folder = props => {
  const { children, shared, abs, rel = ".", warn, Context = Cursor } = props;
  const [exclusive] = React.useState([!shared]);
  const { finder: branch } = usePathStep(rel, abs, Context);
  const folder = useOwnDir(exclusive[0] ? branch : root, warn);
  const value = exclusive[0] ? folder : branch;
  const node = typeof children === "function" ? children(value) : children;

  if (exclusive[0] !== !shared) {
    let log = typeof warn === "function" ? warn : echo;
    if (warn === true || process.env.NODE_ENV === "development") {
      log = log || console.warn;
    }
    log("Unexpected sharing status change: " + !!shared);
    exclusive[0] = !shared;
  }

  return (
    <Context.Provider value={value}>
      {exclusive[0] ? <Volume>{node}</Volume> : node}
    </Context.Provider>
  );
};
