import { produce, nothing } from "immer";

export const produceKeyedAction = (type, key, record, producer, factory) => {
  const name = String(key);
  const redo = [];
  const undo = [];
  const edit = factory ? factory(producer) : producer;
  const value = produce(
    record,
    draft => edit(draft, nothing),
    (patches, invert) => {
      redo.push.apply(redo, patches);
      undo.push.apply(undo, invert);
    }
  );
  return { type, key: name, apply: () => value, undo, redo };
};
