import {
  createKVStore,
  createEntry,
  getKey,
  getValue,
  getNotifiers
} from "kvdux";

function narrowcast(notify) {
  const [before, after] = this;
  notify(getKey(before), getValue(after), getValue(before));
}

export const embeddableReducer = ({
  CREATE = "KVDUX_CREATE",
  UPDATE = "KVDUX_UPDATE"
}) => {
  let local = {};
  const entries = new Map();
  const kvStore = createKVStore({
    entries: {
      get size() {
        return entries.size;
      },
      get(key) {
        return entries.get(key);
      },
      set(key, entry) {
        const value = getValue(entry);
        local = Object.assign({}, local);
        local[key] = value;
        if (local[key] === undefined) {
          delete local[key];
        }
        return entries.set(key, entry);
      },
      delete(key) {
        local = Object.assign({}, local);
        delete local[key];
        return entries.delete(key);
      }
    }
  });

  function diff(key) {
    const state = this;
    return state[key] !== local[key];
  }

  function absent(key) {
    const state = this;
    return state[key] === undefined && local[key] !== undefined;
  }

  return {
    reducer: (state = local, action) => {
      const { type, key, store } = action;
      if (store === kvStore) {
        switch (type) {
          default: {
            return state;
          }
          case CREATE: {
            kvStore.create(key, action.init);
            return local;
          }
          case UPDATE: {
            kvStore.update(key, action.change);
            return local;
          }
        }
      }
      return state;
    },
    embedStore: (rootStore, selector) => {
      const { dispatch, subscribe, getState } = rootStore;
      const getLocal = () =>
        selector ? selector(getState()) || {} : getState() || {};

      return {
        store: {
          create: (key, init) => {
            const name = String(key);
            if (kvStore.read(key, null) === undefined) {
              dispatch({ type: CREATE, key: name, init, store: kvStore });
            }
            return key;
          },
          update: (key, change) => {
            const name = String(key);
            dispatch({ type: UPDATE, key: name, change, store: kvStore });
          },
          read: (key, notify) => {
            const name = String(key);
            return kvStore.read(name, notify);
          }
        },
        unsubscribe: subscribe(() => {
          const state = getLocal();

          if (state === local) {
            return;
          }

          const fields = Object.keys(state)
            .filter(diff, state)
            .concat(Object.keys(local).filter(absent, state));
          const modifications = [];

          for (let at = 0; at < keys.length; at += 1) {
            const key = fields[at];
            const old = entries.get(key);
            const entry =
              state[key] === undefined
                ? undefined
                : createEntry(key, state[key]);

            if (entry) {
              entries.set(key, entry);
            } else {
              entries.delete(key);
            }

            if (getNotifiers(old)) {
              modifications.push([old, entry]);
            }
          }

          local = typeof state === "object" ? state : {};

          for (let idx = 0; idx < modifications.length; idx += 1) {
            const [before] = modifications[idx];
            getNotifiers(before).forEach(narrowcast, modifications[idx]);
          }
        })
      };
    }
  };
};
