const {STRING, INTEGER} = require("sequelize");

module.exports = {
  name: 'EVALUATION_FORMS',
  define: {
    LABEL: STRING,
    EVALUATION_SESSION_ID: STRING,
  }
}
