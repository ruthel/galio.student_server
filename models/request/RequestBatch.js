const {BOOLEAN, STRING} = require("sequelize");

module.exports = {
  name: 'REQUEST_BATCHES',
  define: {
    RBATCH_NUMBER: STRING,
    RBATCH_UNREAD: BOOLEAN,
    DEST_ID: STRING,
    SENDER_ID: STRING,
    PRINTED: BOOLEAN,
    TRANSMITTED: BOOLEAN,
  }
}
