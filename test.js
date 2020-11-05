const gare = require("./gare");

const app = new gare.Router();

app.defer(() => {
  app.map({ methods: "all", urls: "*" }, (req, res) => {
    res.end("404");
  });
  app.pack();
});

app.add(gare.static, __dirname);

const userc = gare.jsonc({
  name: String,
});

app.get("/name/:name", (req, res) => {
  res.jsonc(userc, { name: req.params.name });
});

const server = app.createServer();
server.listen(8080).on("listening", () => {
  console.log("listening on port 8080");
});
