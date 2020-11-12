const gare = require("../gare");

const app = new gare.Router();
const logger = new gare.Logger();

app.defer.add(gare.notFound());
app.defer.pack();

app.add(gare.static(__dirname, false, true));

app.add(gare.traffic({ wait: 1000 }));

app.serve(8080, () => {
  logger.success("Listening on port 8080");
});
