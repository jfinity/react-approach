import { isDraftable, createDraft, finishDraft, nothing } from "immer";

const createEntry = (key, value) => ({ key, value, notifiers: null });

const updateEntry = (key, change, entries, alterations) => {
  if (typeof change === "function") {
    const old = entries.get(key);
    const proxied = isDraftable(old && old.value);
    const draft = !proxied ? old && old.value : createDraft(old && old.value);

    const revision = change(draft, nothing, key);
    const value = proxied ? finishDraft(draft) : revision; // TODO: extract undo/redo patch-set
    const save = revision !== nothing && value !== undefined;
    let entry = save ? old : undefined;

    if (save) {
      if (value !== (old && old.value)) {
        entry = createEntry(key, value);
        entries.set(key, entry);
      }
    } else if (old) {
      entries.delete(key);
    }
    if (old !== entry && old && old.notifiers) {
      alterations.push([old, entry]);
    }
  } else if (change === null) {
    const old = entries.get(key);
    if (old && old.value !== undefined) {
      entries.delete(key);
    }
    if (old && old.notifiers) {
      alterations.push([old, undefined]);
    }
  } else if (Array.isArray(change)) {
    for (let idx = 0; idx < change.length; idx += 1) {
      updateEntry(key, change[idx], entries, alterations);
    }
  } else if (typeof change === "object") {
    updateEntry(change.key, change.edit, entries, alterations);
  }
};

function handleAlteration(notify) {
  const [before, after] = this;
  notify(before.key, after && after.value, before.value);
}

const handleNotifications = alterations => {
  for (let idx = 0; idx < alterations.length; idx += 1) {
    const [before] = alterations[idx];
    const { notifiers } = before;
    notifiers.forEach(handleAlteration, alterations[idx]);
  }
};

export const createKVStore = () => {
  const entries = new Map();

  return {
    create: (key, initialize) => {
      const old = entries.get(key);
      if (!old || old.value === undefined) {
        const value = initialize(key);
        if (value !== undefined) {
          const entry = createEntry(key, value);
          entries.set(key, entry);
          if (old && old.notifiers) {
            handleNotifications([[old, entry]]);
          }
        }
      }
      return key;
    },
    update: (key, change) => {
      const alterations = [];
      if (change === undefined) {
        updateEntry(null, key, entries, alterations);
      } else {
        updateEntry(key, change, entries, alterations);
      }
      handleNotifications(alterations);
    },
    read: (key, notify) => {
      let entry = entries.get(key);
      if (typeof notify === "function") {
        if (!entry) {
          entry = createEntry(key, undefined);
          entries.set(key, entry);
        }
        entry.notifiers = entry.notifiers || new Set();
        entry.notifiers.add(notify);
      }
      return entry && entry.value;
    }
  };
};
