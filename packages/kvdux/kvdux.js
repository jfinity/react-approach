export const getKey = entry => entry && entry.key;
export const getValue = entry => entry && entry.value;
export const getNotifiers = entry => (entry ? entry.notifiers || null : null);

export const createEntry = (key, value) => ({ key, value, notifiers: null });

const updateEntry = (key, change, action, entries, tracked) => {
  if (typeof change === "function") {
    const old = entries.get(key);
    const value = change(getValue(old), action);

    if (value !== getValue(old)) {
      const entry = value === undefined ? undefined : createEntry(key, value);
      if (entry) {
        entries.set(key, entry);
      } else {
        entries.delete(key);
      }
      if (getNotifiers(old)) {
        tracked.push([old, entry]);
      }
    }
  } else if (change === null) {
    const old = entries.get(key);
    if (getValue(old) !== undefined) {
      entries.delete(key);
    }
    if (getNotifiers(old)) {
      tracked.push([old, undefined]);
    }
  } else if (Array.isArray(change)) {
    for (let idx = 0; idx < change.length; idx += 1) {
      updateEntry(key, change[idx], action, entries, tracked);
    }
  } else if (typeof change === "object") {
    updateEntry(String(change.key), change.apply, change, entries, tracked);
  }
};

function handleModification(notify) {
  const [before, after] = this;
  notify(getKey(before), getValue(after), getValue(before));
}

const handleNotifications = modifications => {
  for (let idx = 0; idx < modifications.length; idx += 1) {
    const [before] = modifications[idx];
    getNotifiers(before).forEach(handleModification, modifications[idx]);
  }
};

export const createKVStore = config => {
  const { entries = new Map() } = config || {};

  // TODO: use HTML verbs instead (put, patch, delete, get/head, connect)
  // TODO: consider an "optimizing compiler/cache" that gradually detects...
  // ...similarities between patches over time and makes an effort to...
  // ...memoize portions of the result to augment referential equalities
  return {
    create: (key, initialize) => {
      const old = entries.get(key);
      if (getValue(old) === undefined) {
        if (typeof initialize === "function") {
          const value = initialize(key);
          if (value !== undefined) {
            const entry = createEntry(key, value);
            entries.set(key, entry);
            if (getNotifiers(old)) {
              handleNotifications([[old, entry]]);
            }
          }
        }
      }
      return key;
    },
    update: (key, change) => {
      const modifications = [];
      if (change === undefined) {
        updateEntry(null, key, key, entries, modifications);
      } else {
        updateEntry(String(key), change, String(key), entries, modifications);
      }
      handleNotifications(modifications);
    },
    read: (key, notify) => {
      let entry = entries.get(key);
      if (typeof notify === "function") {
        if (!entry) {
          entry = createEntry(key, undefined);
          entries.set(key, entry);
        }
        entry.notifiers = (getNotifiers(entry) || new Set()).add(notify);
      }
      return getValue(entry);
    }
  };
};
