const gare = require("../gare");
const path = require("path");

const app = new gare.Router();
const logger = new gare.Logger();

app.defer.add(gare.basic404("json"));
app.add(gare.traffic({ wait: 1000 }));
app.add(gare.static(path.dirname(__dirname), false, true));
app.defer.pack();

const router = new gare.Router();

router.get("/hello", (req, res) => {
  res.text("hello");
});
router.add(gare.basic404("json"));
app.all("/router*", router.handle);

app.serve(8080, () => {
  logger.success("Listening on port 8080");
});
