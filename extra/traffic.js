module.exports = (options = {}) => {
  const { whitelist = [], time = 60 * 1000, max = 100, message = "too many requests", methods = "ALL", urls = null, type = "text/plain", code = 429, wait = 0, ignore = false } = options;
  return (router) => {
    let data = {};
    setInterval(() => {
      data = {};
    }, time);
    let handler = (req, res) => {
      let ip = req.connection.remoteAddress;
      if (whitelist.includes(ip)) return req.next();
      else if (data[ip]) {
        if (data[ip] >= max) {
          if (wait)
            return setTimeout(() => {
              req.next();
            }, wait);
          if (ignore) return;
          res.statusCode = code;
          res.setHeader("Content-Type", type);
          return res.end(message);
        } else data[ip]++;
      } else data[ip] = 1;
      req.next();
    };
    if (urls) router.map({ methods, urls, pre: true }, handler);
    else router.map({ methods }, handler);
  };
};
