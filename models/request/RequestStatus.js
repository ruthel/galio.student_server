const {STRING} = require("sequelize");

module.exports = {
  name: 'REQUEST_STATS',
  define: {
    REQ_STATUS_ID: STRING,
    REQ_STATUS_CODE: STRING,
    REQ_STATUS_LABEL: STRING,
  }
}
