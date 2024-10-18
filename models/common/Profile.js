const {STRING, INTEGER} = require("sequelize");
module.exports = {
  name: 'PROFILES',
  define:{
    PROFILNAME: STRING,
    PRIVILEGE: STRING,
    PROFILEID: STRING,
    REQUEST_GROUP: STRING,
  }
}
