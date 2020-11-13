const gare = require("../gare");
const path = require("path");

const app = new gare.Router();
const logger = new gare.Logger();

app.defer.add(
  gare.basic404((req, res) => {
    res.text("hello");
  })
);
app.defer.pack();

app.add(gare.traffic({ wait: 1000 }));
app.add(gare.static(path.dirname(__dirname)));

app.serve(8080, () => {
  logger.success("Listening on port 8080");
});
