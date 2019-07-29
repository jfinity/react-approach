import React from "react";

const initMiddleware = () => null;

const wrapMiddleware = middleware =>
  typeof middleware === "function"
    ? function() {
        middleware.apply(this, arguments); // TODO: handle this result(?)
        return initMiddleware();
      }
    : initMiddleware;

export const useMiddleware = (config, factory) => {
  const middleware = React.useRef(initMiddleware);

  middleware.current =
    middleware.current === initMiddleware
      ? wrapMiddleware(factory ? factory(config) : config)
      : middleware.current;

  return React.useReducer(middleware.current, initMiddleware())[1];
};
