import { useMiddleware } from "react-middleware";
import { useRecordFolder } from "react-record-folder";

// TextField.js
export const createTextInputMiddleware = ({ folder, notify }) => ev => {
  notify({
    type: "onChange",
    key: folder,
    // undo,
    // redo,
    edit: draft => {
      draft.value = ev.targe.value;
    }
  });
};

export const TextFieldRecord = ({ value = "" } = {}) => ({ value });

export const TextField = props => {
  const { record, notify, folder } = useRecordFolder(props);
  const handleNative = useMiddleware(
    { folder, notify },
    createTextInputMiddleware
  );

  return <input type="text" value={record.value} onChange={handleNative} />;
};

// FieldList.js
export const createTextFieldMiddleware = ({ folder, notify }) => action => {
  switch (action.type) {
    case "onChange": {
      return notify([
        action,
        {
          type: "onItemChange",
          key: folder,
          edit: draft => draft
        }
      ]);
    }
  }
};

export const FieldList = props => {
  const { record, store, notify, folder } = useRecordFolder(props);
  const handleTextField = useMiddleware(
    { folder, notify },
    createTextFieldMiddleware
  );

  return (
    <div>
      {record.list.map(item => (
        <TextField
          notify={handleTextField}
          folder={store.create(folder(item.id), () => TextFieldRecord())}
        />
      ))}
    </div>
  );
};
