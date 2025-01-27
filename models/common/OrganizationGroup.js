const {STRING, INTEGER, BOOLEAN} = require('sequelize');

module.exports = {
  name: 'ORGANIZATION_GROUPS',
  define: {
		ORGA_GROUP_ID: {
			type: STRING,
		},
    ORGA_GROUP_NAME: STRING,
    ORGA_GROUP_PARENT_ID: STRING,
    ORGA_GROUP_LEVEL: INTEGER,
    ORGA_GROUP_STATUS: STRING,
    IS_ACADEMIC_GROUP: BOOLEAN,
    ORGA_SUBJECT_CODE: STRING,
  }
}

