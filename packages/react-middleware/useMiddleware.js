import React from "react";

const applyUnary = (fn, arg) => typeof fn === "function" ? fn(arg) : null;

const bindMiddleware = ref =>
  function() {
    if (typeof ref.handler === "function") {
      return ref.handler.apply(this, arguments);
    }
    return undefined;
  };

export const useMiddleware = (...args) => {
  const curry = args.pop();
  const handler = args.reduce(applyUnary, curry);
  const ref = React.useRef(null);

  ref.current = ref.current || { handler, middleware: bindMiddleware(ref) };
  ref.current.handler = handler;

  return ref.current.middleware;
};
