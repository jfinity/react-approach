export const useRenderMetrics = (type, path, delimiter = "/") => {
  return useMetrics()
    .tally("render", type, path)
    .tally("render", delimiter, ...path.split(delimiter), delimiter + type);
};
