const app = require("./app");

const PORT = process.env.PORT || 15000;
app.listen(PORT, () => {
  console.log(`Started express sever on port ${PORT}`);
});
