const {BOOLEAN, STRING, DATE, INTEGER} = require('sequelize');

module.exports = {
  name: 'SESSION_APPLICATIONS',
  define: {
    ACADEMIC_YEAR: STRING,
    START_DATE: DATE,
    END_DATE: DATE,
    MANUAL_CLOSURE: {
      type: BOOLEAN,
    },
    DESIGNATION: STRING,
    SUBJECT_CONSTRAINT_ID: {
      type: INTEGER,
      defaultValue: 1,
    },
    ACTIVED: {
      type: BOOLEAN,
    },
  },
}
