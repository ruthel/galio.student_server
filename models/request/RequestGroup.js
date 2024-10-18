const {STRING, BOOLEAN} = require("sequelize");
module.exports = {
  name: 'REQUEST_GROUPS',
  define:{
    REQUEST_GROUP_ID: STRING,
    REQ_GROUP_NAME: STRING,
    REQ_GROUP_CONFIG_PART: STRING,
    REQ_GROUP_MANAGER: {
      type: STRING,
      ref: 'USERS',
    },
    REQ_GROUP_CLOSE_RIGHT: BOOLEAN,
  },
}

