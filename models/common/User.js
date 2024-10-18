const {STRING, INTEGER} = require('sequelize');

module.exports = {
  name: 'USERS',
  define: {
		USERNAME: STRING,
    USERFULLNAME: STRING,
    PASSWORD: STRING,
    USERPROFILE: STRING,
    USERPRIVILEGE: STRING,
    ACTIVATED: STRING,
    TOKEN: STRING,
    ORGANIZATION_EMAIL: STRING,
    ORGANIZATION_GROUP: {
      type: INTEGER,
    },
    REQUEST_GROUP_ID: {
      type: STRING,
    }
  }
}
