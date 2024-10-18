const {INTEGER, BOOLEAN, STRING} = require('sequelize');

module.exports = {
  name: 'APPLICATION_CHOICES',
  define: {
    SUBJECT_ID: STRING,
    APPLICATION_ID: {
      type: INTEGER,
      ref: 'APPLICATIONS',
      key: 'id',
    },
    AFFECTATION: INTEGER,
    SUP_AFFECTATION: INTEGER,
    SUP_AUTHOR: {
      type: INTEGER,
      ref: 'USERS',
      key: 'id',
    },
    CATEGORY: STRING,
    CLOSURE: BOOLEAN,
    SUP_CLOSURE: BOOLEAN,
    AFFECTED_CLASS_ID: STRING,
  }
}
