const {STRING, INTEGER} = require("sequelize");

module.exports = {
	name: 'CLASSES',
	freezeTableName: true,
	define: {
		CLASS_ID: {
			type: STRING,
			allowNull: false
		},
		CLASS_NAME: STRING,
		SPECIALTY_ID: STRING,
		SPECIALTY_NAME: STRING,
		SPECIALTY_DESCRIPTION: STRING,
		LEVEL_ID: STRING,
		LEVEL_NAME: STRING,
		BRANCH_ID: STRING,
		BRANCH_ABREVIATION: STRING,
		BRANCH_NAME: STRING,
		CYCLE_ID: STRING,
		CYCLE_NAME: STRING,
		ORGANIZATION_GROUP_ID: {
			type: STRING,
		},
	}
}
