const sendSlash = cursor => cursor("/");
const sendNullSlash = cursor => cursor(null, "/");

function toPath() {
  const cursor = this;
  return cursor();
}

class Step {
  constructor(temporary, cursor, path = cursor) {
    this.temp = !!temporary;
    this.path = String(path);
    this.finder = cursor;
  }
  toString() {
    return this.path;
  }
}

export function pathfinder() {
  const path = arguments.length > 0 ? String(arguments[0]) : "";
  const temporary = arguments.length > 1 ? !!arguments[1] || false : false;
  let finders = arguments.length > 2 ? arguments[2] || new Map() : new Map();
  let ancestor = arguments.length > 3 ? arguments[3] || cursor : cursor;

  const memos = ancestor === cursor ? finders : new Map();

  if (/\.+\/|\.$|\/$/.test(path)) {
    throw new Error("Invalid full path: " + path);
  }

  function cursor() {
    if (arguments.length === 0) {
      return new Step(!!temporary, cursor, path);
    } else if (arguments.length === 1) {
      if (Array.isArray(arguments[0])) {
        return cursor.apply(this, arguments[0])
      } else if (arguments[0] === undefined) {
        memos.forEach(sendSlash);
        memos.clear();
        return new Step(!!temporary, cursor, path);
      } else if (arguments[0] === null) {
        memos.forEach(sendNullSlash);
        memos.clear();
        return new Step(!!temporary, cursor, path);
      } else if (arguments[0] === true || arguments[0] === false) {
        if (temporary === arguments[0]) {
          return new Step(!!temporary, cursor, path);
        }
        return new Step(
          !!arguments[0],
          pathfinder(path, !!arguments[0], null, null),
          path
        );
      } else {
        const key = String(arguments[0]);
        switch (key) {
          case "": {
            return new Step(
              !!temporary,
              // never referentially equal
              pathfinder(path, !!temporary, null, null),
              path
            );
          }
          case ".": {
            // always referentially equal
            return new Step(!!temporary, cursor, path);
          }
          case "..": {
            const at = path.lastIndexOf("/");
            const use = path && path.slice(0, at + 1 ? at : 0);
            if (temporary) {
              return new Step(true, pathfinder(use, true, null, null), use);
            }
            if (ancestor === cursor && path !== "") {
              finders = new Map().set(path, cursor);
              ancestor = pathfinder(use, false, finders, null);
            }
            return new Step(false, ancestor, use);
          }
          case "/": {
            if (ancestor !== cursor && finders.get(path) === cursor) {
              finders.delete(path);
            }
            ancestor = cursor;
            finders = memos;
            return new Step(!!temporary, cursor, path);
          }
          default: {
            if (key.charCodeAt(0) === "/".charCodeAt(0)) {
              throw new Error("Slash-paths are reserved for commands: " + key);
            } else if (key.indexOf("/") > 0) {
              return cursor.apply(this, key.split("/"));
            }

            const loc = path ? path + "/" + key : key;
            if (temporary) {
              return new Step(true, pathfinder(loc, true, null, null), loc);
            }
            return new Step(
              false,
              memos.get(loc) ||
                memos.set(loc, pathfinder(loc, false, memos, cursor)).get(loc),
              loc
            );
          }
        }
      }
    }

    let next = cursor;
    let idx = 1;
    for (idx = 1; idx < arguments.length; idx += 1) {
      next = next(arguments[idx - 1]).finder;
    }
    return next(arguments[idx - 1]);
  }

  cursor.toString = toPath;

  return cursor;
}
