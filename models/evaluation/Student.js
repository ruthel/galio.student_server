const {STRING, INTEGER, DATE, BOOLEAN, DATEONLY} = require("sequelize");

module.exports = {
	name: 'STUDENTS',
	freezeTableName: true,
	define: {
		// EMAIL: {
		// 	type: STRING,
		// 	allowNull: false,
		// },
		STUDENT_ID: {
			type: STRING(20),
			allowNull: false,
			unique: true
		},
		// ACCESS_COURSES: {
		// 	type: BOOLEAN,
		// 	allowNull: false,
		// },
		// REGISTRATION_ID: {
		// 	type: STRING,
		// 	allowNull: false,
		// 	unique: true
		// },
		// TOKEN: STRING,
		// EMAIL_VERIFIED: {
		// 	type: BOOLEAN,
		// 	allowNull: false,
		// },
		// EMAIL_VERIFICATION_TOKEN: STRING,
		// REGISTRATION_TYPE: STRING,
		// SIGN_CODE: STRING(6),
		// RELIGION: STRING(20),
		// LASTNAME: STRING,
		// FIRSTNAME: STRING,
		// GENDER: STRING(1),
		// COUNTRY: STRING,
		// CLASS_ID: STRING(20),
		// BIRTHDATE: DATEONLY,
		// BIRTHPLACE: STRING,
		// EMERGNAME1: STRING,
		// EMERGNUM1: STRING(15),
		// FATHER_NAME: STRING,
		// FATHER_JOB: STRING(100),
		// FATHER_BIRTH: DATEONLY,
		// FATHER_CONTACT: STRING(15),
		// MOTHER_NAME: STRING,
		// MOTHER_JOB: STRING(100),
		// MOTHER_BIRTH: DATEONLY,
		// MOTHER_CONTACT: STRING(15),
	}
}
