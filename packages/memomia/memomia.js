// combine generator yield "hints/labels" with (immer?) proxies

hint => function * test () {
  hint["cache-bucket"]; // hint is proxy
  yield hint.alpha && ["array"];
  yield hint.beta && {key: Symbol`value`};
  (yield []).map(() => {}, {});
  // you must only yield functions that do not capture/enclose locals(?)
  // (optionally compare -- pure -- functions by their toString?)
}

const useMemomia = (fn) => useState(() => memomia(fn))[0];
