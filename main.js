import { useMiddleware } from "react-middleware";
import { useRecordFolder } from "react-record-folder";
import { produceKeyedAction } from "kvdux-immer";

// ".//namespace/key/path/subpath".split("")
// "./namespace//key/path/subpath"

// TextField.js
export const TextFieldRecord = ({ value = "" } = {}) => ({ value });

export const TextField = props => {
  const folder = useOwnDir(props.folder);
  useRenderMetrics("TextField", folder);

  const store = useKVDux();
  store.backup(folder, TextFieldRecord);

  const forceUpdate = useForceUpdate();
  const record = store.read(folder, forceUpdate);

  const { dispatch = store.update } = props;
  const onChange = useMiddleware(
    { dispatch, folder },
    ({ dispatch: $dispatch, folder: $folder }) => ev => {
      const { value } = ev.target;
      $dispatch({
        type: "TextField:onChange",
        payload: {
          value
        },
        intent: {
          key: $folder,
          merge: {
            value
          }
        }
      });
    }
  );

  return <input type="text" value={record.value || ""} onChange={onChange} />;
};

// FieldList.js
export const FieldListRecord = ({ list = { keys: [], vals: {} } }) => ({
  list
});

export const FieldList = props => {
  const folder = useOwnDir(props.folder);
  useRenderMetrics("FieldList", folder);

  const store = useKVDux();
  store.backup(folder, FieldListRecord);

  const forceUpdate = useForceUpdate();
  const record = store.read(folder, forceUpdate);

  const { dispatch = store.update } = props;
  const handleTextField = useMiddleware(
    { dispatch, folder },
    ({ dispatch: $dispatch, folder: $folder }) => action => {
      switch (action.type) {
        case "TextField:onChange": {
          const { value } = action.payload;
          const id = action.intent.key.slice(1 + $folder.length);
          return $dispatch({
            type: "FieldList:onChange",
            payload: {
              id,
              value
            },
            intent: [
              action.intent,
              {
                key: $folder,
                merge: {
                  list: {
                    vals: {
                      [id]: {
                        value
                      }
                    }
                  }
                }
              }
            ]
          });
        }
      }
    }
  );

  return (
    <div>
      {record.list.keys.map(id => (
        <TextField
          key={id}
          dispatch={handleTextField}
          folder={store.backup(folder + "/" + id, () =>
            TextFieldRecord({ value: record.list.vals[id].value })
          )}
        />
      ))}
    </div>
  );
};

export const ScrollViewRecord = ({ scrollX = 0, scrollY = 0 }) => ({
  scrollX,
  scrollY
});

export const ScrollView = props => {
  const folder = useOwnDir(props.folder);
  useRenderMetrics("ScrollView", folder);

  const store = useKVDux();
  store.backup(folder, ScrollViewRecord);

  const view = React.useRef(null);

  const rescroll = useMiddleware([view], ([$view]) => (record, action) => {
    const { target } = $view.current;

    if (!action || action !== $view.current.action) {
      if (target) {
        if (record && typeof record.scrollX === "number") {
          target.scrollLeft = record.scrollX;
        }
        if (record && typeof record.scrollY === "number") {
          target.scrollTop = record.scrollY;
        }
      }
    }

    $view.current.action = null;

    if (target) {
      $view.current.store.read(folder, rescroll);
    }
  });

  view.current = view.current || {
    store,
    folder,
    action: null,
    target: null,
    ref: target => {
      view.current.target = target;
      rescroll(view.current.store.read(view.current.folder), null);
    }
  };
  view.current.store = store;
  view.current.folder = folder;
  // useImpact() to handle store/folder swap

  const { dispatch = store.update } = props;
  const onScroll = useMiddleware(
    { dispatch, folder },
    ({ dispatch: $dispatch, folder: $folder, view: $view }) => ev => {
      const { scrollLeft, scrollTop } = ev.target;
      const payload = { scrollX: scrollLeft, scrollY: scrollTop };
      $view.current.action = {
        type: "ScrollView:onScroll",
        payload,
        intent: {
          key: $folder,
          merge: payload
        }
      };
      $dispatch($view.current.action);
    }
  );

  const { children } = props;

  return (
    <div ref={view.current.ref} onScroll={onScroll}>
      {children}
    </div>
  );
};

// multiple folders (like shared themes) handled by reference path(?)

// trigger an update in one folder by listening to the intents of another

// just recompute entire folder contents every render (and benchmark redraws)

// bubble-dispatch and capture-dispatch -- will vs. did (stage/commit)

// make folder hooks handle arrays

// useWill() plus <Would value />

// [data-dir^="parent/"][data-dir$="/child"][data-dir*="/self/"]

// useImpact("alternative to useEffect -- watch out for React.Strict/Concurrent")

// own/sync/read folders (exclusive, reactive, passive)

const Config = React.createContext("app/cfg");

// use facades
// mocklofi editors and collection debuggers are desktop apps (use plain antd)

const EntityMetaRow = props => {
  const folder = useOwnDir(props.folder);
  useRenderMetrics("EntityMetaRow", folder);

  const store = useKVDux();
  store.backup(folder, TextFieldRecord);
  const forceUpdate = useForceUpdate();
  const record = store.read(folder, forceUpdate);

  const { mode = "default" } = store.read(React.useContext(Config)) || {};

  const { dispatch = store.update } = props;
  const handleTextField = useMiddleware(
    { dispatch, folder },
    ({ dispatch: $dispatch, folder: $folder }) => action => {
      switch (action.type) {
        case "TextField:onChange": {
          const { value } = action.payload;
          return $dispatch({
            type: "EntityMetaRow:onChange",
            payload: {
              value
            },
            intent: [
              action.intent,
              {
                key: $folder,
                merge: {
                  name: value
                }
              }
            ]
          });
        }
      }
    }
  );

  switch (mode) {
    case "edit": {
      return (
        <Layout>
          {{
            input: (
              <TextField
                dispatch={handleTextField}
                folder={store.backup(folder + "/input", () =>
                  TextFieldRecord({ value: record.name })
                )}
              />
            )
          }}
        </Layout>
      );
    }

    default: {
      return <Layout>{{
        label: (
          <TextLabel>{record.name}</TextLabel>
        )
      }}</Layout>;
    }
  }
};


// click square to toggle (presentations and -- drag -- actions)
// use (even) numpad-grid keys for rapid framing: 4~~~~~6
// (0 -- zero -- deletes gutters and downspouts until a number)
// (5 -- five -- is a "passthrough")
// (1 and 9 describe the "extents", 3 and 7 optionally define "anchors")


`
[           ]
[ 7 ~ 8 ~ 9 ]  0=123  ~
[ |   |   | ]         |
[ 4 ~ 5 ~ 6 ]  8=789  2=456
[ |   |   | ]  |
[ 1 ~ 2 ~ 3 ]  ~   5=3568
[           ]

|~~~~~6=
`