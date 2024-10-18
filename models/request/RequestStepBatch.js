const {STRING} = require("sequelize");
module.exports = {
  name: 'REQUEST_STEP_BATCHES',
  define: {
    REQUEST_ID: STRING,
    RBATCH_ID: STRING,
    REQUEST_DEST_ID: STRING
  },
}
