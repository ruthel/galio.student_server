const {STRING, INTEGER} = require("sequelize");

module.exports = {
  name: 'STUDENT_ANSWERS',
  define: {
    QUESTION_FORM_ID: {
			type: STRING,
		},
		STUDENT_EVALUATION_SESSION_ID: {
			type: INTEGER,
		},
    CHOSEN_ANSWER_ID: STRING
  }
}
