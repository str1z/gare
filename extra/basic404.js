const jsonc = require("../core/jsonc");

const resC = jsonc({
  error: String,
  url: String,
});

module.exports = (mode = "text") => (router) => {
  if (typeof mode == "function") return router.map({ methods: "all", urls: "*" }, mode);
  if (mode == "text")
    return router.map({ methods: "all", urls: "*" }, (req, res) => {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/plain");
      res.end(`Cannot ${req.method} ${req.URL}`);
    });
  if (mode == "json")
    return router.map({ methods: "all", urls: "*" }, (req, res) => {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(resC({ error: "not found", url: req.URL }));
    });
};
