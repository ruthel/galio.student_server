const {STRING, INTEGER} = require("sequelize");
module.exports = {
	name: 'PAYMENT_MODES',
	define: {
		ABBREV: STRING,
		DESIGNATION: STRING,
	}
}
