const {STRING, INTEGER} = require('sequelize');

module.exports = {
  name: 'LABEL_DECISIONS',
  define:{
    LIBELLE: STRING,
    LIB_UNITY_ID: STRING,
    LIB_DEST_ID: STRING,
    REQ_STATUS_ID: STRING
  }
}
