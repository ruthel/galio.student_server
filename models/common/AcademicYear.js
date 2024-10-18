const {STRING, INTEGER, BOOLEAN} = require("sequelize");

module.exports = {
  name: 'ACADEMIC_YEARS',
	freezeTableName: true,
  define: {
		YEAR_ID: {
			type: STRING(15),
			allowNull: false,
			unique: true
		},
		YEAR_NAME: {
			type: STRING(15),
			allowNull: false
		},
    COUNT_TOTAL_STUDENT: INTEGER,
    COUNT_FEMALE_STUDENT: INTEGER,
    COUNT_MALE_STUDENT: INTEGER,
		ACTIVATED: {
			type: BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
  }
}
