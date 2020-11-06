const gare = require("../gare");

const app = new gare.Router();
const logger = new gare.Logger();

app.defer.add(gare.notFound());
app.defer.pack();

app.add(gare.static(__dirname));

app.add(gare.traffic({ wait: 1000 }));

const server = app.createServer();
server.listen(8080).on("listening", () => {
  logger.success("Listening on port 8080");
});
