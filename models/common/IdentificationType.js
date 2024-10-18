const {STRING, INTEGER} = require('sequelize');

module.exports = {
	name: 'IDENTIFICATION_TYPES',
	define: {
		ITYPENAME: STRING,
		ITYPEABR: STRING,
	}
}
