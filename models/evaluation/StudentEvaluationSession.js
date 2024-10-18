const {STRING, DATE, BOOLEAN, fn} = require("sequelize");

module.exports = {
	name: 'STUDENT_EVALUATION_SESSIONS',
	define: {
		EVALUATION_SESSION_ID: {
			type: STRING,
		},
		STUDENT_ID: {
			type: STRING(20),
		},
		SUBJECT_ID: STRING,
		EMPLOYEE_ID: STRING,
		STATUS: {
			type: STRING,
			allowNull: true,
		},
	}
}
