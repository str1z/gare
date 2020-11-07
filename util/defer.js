function defer(target) {
  let queue = [];
  let deferred = () => {
    for (let fn of queue) fn();
    queue = [];
  };
  for (let key in target)
    if (typeof target[key] == "function")
      deferred[key] = (...args) => {
        queue.push(() => target[key](...args));
        return deferred;
      };
  return deferred;
}

module.exports = defer;
