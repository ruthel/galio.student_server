const {STRING, INTEGER, BOOLEAN} = require('sequelize');

module.exports = {
  name: 'APPLICATIONS',
  define: {
    EMPLOYEE_ID: {
      type: STRING,
      ref: 'EMPLOYEES',
      key: 'MATRICULE'
    },
    TOTAL_HOURS: {
      type: INTEGER,
    }
    ,
    SESSION_APPLICATION_ID: {
      type: INTEGER,
      ref: 'SESSION_APPLICATIONS',
      key: 'id'
    },
    SUBJECT_CONSTRAINT_ID: {
      type: INTEGER,
      ref: 'SUBJECT_CONSTRAINTS',
      key: 'id'
    },
    CLOSED: {
      type: BOOLEAN,
    },
  }
}

