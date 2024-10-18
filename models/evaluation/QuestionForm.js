const {STRING, INTEGER} = require("sequelize");

module.exports = {
  name: 'QUESTION_FORMS',
  define: {
	  LABEL: STRING,
		QUESTION_FORM_ID: {
			type: STRING,
		},
		QUESTION_PARENT_ID: {
			type: STRING,
		},
    TYPE: STRING,
		EVALUATION_FORM_ID: {
			type: INTEGER,
		},
  }
}
