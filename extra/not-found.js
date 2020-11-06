const jsonc = require("../core/jsonc");

const resC = jsonc({
  error: String,
  url: String,
});

module.exports = (json = false) => (router) => {
  router.map({ methods: "all", urls: "*" }, (req, res) => {
    res.statusCode = 404;
    if (json) {
      res.setHeader("Content-Type", "application/json");
      res.end(resC({ error: "not found", url: req.URL }));
    } else {
      res.setHeader("Content-Type", "text/plain");
      res.end(`Cannot ${req.method} ${req.URL}`);
    }
  });
};
