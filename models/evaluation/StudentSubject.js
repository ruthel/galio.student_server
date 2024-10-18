const {STRING, INTEGER} = require("sequelize");

module.exports = {
	name: 'STUDENT_SUBJECTS',
	define: {
		STUDENT_ID: {
			type: STRING(20),
		},
		SUBJECT_ID: {
			type: STRING,
		},
		CLASS_ID: {
			type: STRING,
		},
	}
}
