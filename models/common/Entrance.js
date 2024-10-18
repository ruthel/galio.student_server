const {STRING, INTEGER, BOOLEAN} = require("sequelize");

module.exports = {
	name: 'ENTRANCE',
	freezeTableName: true,
	define: {
		Year_ID: STRING,
		Year_Guid: STRING,
		Year_Name: STRING,
		Year_Begin_Date: STRING,
		Year_End_Date: STRING,
		School_ID: STRING,
		School_Guid: STRING,
		School_Abreviation: STRING,
		School_Name: STRING,
		Entrance_ID: STRING,
		Entrance_Guid: STRING,
		Entrance_Name: STRING,
		Entrance_Registration_Limit_Date: STRING,
		Entrance_Registration_Amount: STRING,
		Entrance_Evaluation_Begin_Date: STRING,
		Entrance_Evaluation_End_Date: STRING,
		Ministry_ID: STRING,
		Cycle_Id: STRING,
		Cycle_Guid: STRING,
		Cycle_Name: STRING,
		Cycle_Position: STRING,
		Level_ID: STRING,
		Level_Guid: STRING,
		Level_Name: STRING,
		Speciality_ID: STRING,
		Speciality_Guid: STRING,
		Speciality_Name: STRING,
		Speciality_Description: STRING,
		Speciality_Min_Level_ID: STRING,
		Speciality_Min_Level_Name: STRING,
		Speciality_Max_Level_ID: STRING,
		Speciality_Max_Level_Name: STRING,
	}
}