const {STRING, INTEGER} = require("sequelize");

module.exports = {
  name: 'EVALUATIONS',
  define: {
    SUBJECT_ID: STRING,
		CLASS_ID: STRING,
    EVALUATION_SESSION_ID: {
			type: STRING,
		},
		EMPLOYEE_ID: {
			type: STRING,
		},
  }
}
