const testKey = key => (/^[^/]+\/|\.$/.test(key) ? "" : key);

const sendSlash = cursor => cursor("/");
const sendNullSlash = cursor => cursor(null, "/");

function toPath() {
  const cursor = this;
  return cursor();
}

export function pathfinder() {
  const path = arguments.length > 0 ? String(arguments[0]) : "";
  const temporary = arguments.length > 1 ? arguments[1] || false : false;
  let finders = arguments.length > 2 ? arguments[2] || new Map() : new Map();
  let ancestor = arguments.length > 3 ? arguments[3] || cursor : cursor;

  const memos = ancestor === cursor ? finders : new Map();

  if (/\.+\/|\.$|\/$/.test(path)) {
    throw new Error("Invalid full path: " + path);
  }

  function cursor() {
    if (arguments.length === 0) {
      return path;
    } else if (arguments.length === 1) {
      if (arguments[0] === undefined) {
        memos.forEach(sendSlash);
        memos.clear();
        return cursor;
      } else if (arguments[0] === null) {
        memos.forEach(sendNullSlash);
        memos.clear();
        return cursor;
      } else if (arguments[0] === true || arguments[0] === false) {
        if (temporary === arguments[0]) {
          return cursor;
        }
        return pathfinder(path, arguments[0] ? true : false, null, null);
      } else {
        const key = String(arguments[0]);
        switch (key) {
          case "": {
            return pathfinder(path, temporary ? true : false, null, null); // never referentially equal
          }
          case ".": {
            return cursor; // always referentially equal
          }
          case "..": {
            const at = path.lastIndexOf("/");
            if (temporary) {
              return path !== ""
                ? pathfinder(path.slice(0, at + 1 && at), true, null, null)
                : cursor;
            }
            if (ancestor === cursor && path !== "") {
              finders = new Map().set(path, cursor);
              ancestor = pathfinder(
                path.slice(0, at + 1 && at),
                false,
                finders,
                null
              );
            }
            return ancestor;
          }
          case "/": {
            if (ancestor !== cursor && finders.get(path) === cursor) {
              finders.delete(path);
            }
            ancestor = cursor;
            finders = memos;
            return cursor;
          }
          default: {
            const next = path ? path + "/" + key : key;
            if (!testKey(key)) {
              throw new Error("Invalid path fragment: '" + key + "'");
            } else if (key.charCodeAt(0) === "/".charCodeAt(0)) {
              throw new Error("Slash-paths are reserved for commands: " + key);
            }
            if (temporary) {
              return pathfinder(next, true, null, null);
            }
            return (
              memos.get(next) ||
              memos.set(next, pathfinder(next, false, memos, cursor)).get(next)
            );
          }
        }
      }
    }

    let result = cursor;
    let idx = 1;
    for (idx = 1; idx < arguments.length; idx += 1) {
      result = result(arguments[idx - 1]);
    }
    return result(arguments[idx - 1]);
  }

  cursor.toString = toPath;

  return cursor;
}
