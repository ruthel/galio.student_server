const {STRING, INTEGER} = require("sequelize");

module.exports = {
  name: 'PREDEFINED_ANSWERS',
  define: {
    LABEL: STRING,
		PREDEFINED_ANSWER_ID: {
			type: STRING,
			allowNull: false
		},
  }
}
