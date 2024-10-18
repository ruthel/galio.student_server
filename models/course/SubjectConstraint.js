const {INTEGER} = require("sequelize");
module.exports = {
  name: 'SUBJECT_CONSTRAINTS',
  define: {
    SUBJECT_CONS_TYPES_ID: INTEGER,
    LEVEL1_J: INTEGER,
    LEVEL2_J: INTEGER,
    LEVEL3_J: INTEGER,
    LEVEL4_J: INTEGER,
    LEVEL5_J: INTEGER,
    LEVEL1_S: INTEGER,
    LEVEL2_S: INTEGER,
    LEVEL3_S: INTEGER,
    LEVEL4_S: INTEGER,
    LEVEL5_S: INTEGER,
  },
}
