const {STRING, INTEGER} = require("sequelize");

module.exports = {
  name: 'PREDEFINED_QUESTION_ANSWERS',
  define: {
    LABEL: STRING,
    MARK: STRING,
		QUESTION_FORM_ID: {
			type: STRING,
		},
  }
}
