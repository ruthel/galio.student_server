const {INTEGER, STRING, TINYINT, DATE} = require('sequelize');

module.exports = {
  name: 'REQUEST_STEPS',
  define:{
    REQUEST_ID: {
      type: STRING,
      ref: 'REQUESTS',
      key: 'REQUEST_ID',
    },
    RSTEPCONFIG_ID: STRING,
    RSTEP_DECISION: STRING,
    RSTEP_COMM: STRING,
    RSTEP_STATUS: STRING,
    RSTEP_ESCALADE: TINYINT,
    RSTEP_TIME: DATE,
  }
}
