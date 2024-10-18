const {STRING, INTEGER} = require("sequelize");
module.exports = {
  name: 'SETTINGS',
  define:{
    LANGUAGE: STRING,
    EMPLOYEE_ID: STRING,
  }
}
