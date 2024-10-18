const {STRING} = require("sequelize");
module.exports = {
	name: 'SPECIALITY',
	define: {
		Speciality_ID: STRING,
		Speciality_Guid: STRING,
		Speciality_Name: STRING,
		Speciality_Description: STRING,
		Speciality_Min_Level_ID: STRING,
		Speciality_Min_Level_Name: STRING,
		Speciality_Max_Level_ID: STRING,
		Speciality_Max_Level_Name: STRING,
		Ministry_ID: STRING,
		Cycle_Id: STRING,
		Cycle_Guid: STRING,
		Cycle_Name: STRING,
		Cycle_Position: STRING,
	}
}
