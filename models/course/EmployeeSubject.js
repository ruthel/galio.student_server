const {STRING, INTEGER, DATE} = require('sequelize');

module.exports = {
  name: 'EMPLOYEE_SUBJECTS',
  define: {
    SUBJECT_ID: STRING,
    EMPLOYEE_ID: STRING,
    SUBJECT_ABREVIATION_CLASS: STRING,
    CLASS_ID: STRING,
    SCHOOL_ID: STRING,
    YEAR_NAME: STRING,
    YEAR_START: DATE,
    YEAR_END: DATE,
    LEVEL_ID: INTEGER,
    SUBJECT_PERIOD_POSITION: INTEGER,
    SUBJECT_STATUS: STRING,
  }
}
