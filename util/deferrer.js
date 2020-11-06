function Deferrer(target) {
  this.router = target;
  for (let key in target)
    if (typeof target[key] == "function")
      this[key] = (...args) => {
        process.nextTick(() => target[key](...args));
        return this;
      };
}

module.exports = Deferrer;
