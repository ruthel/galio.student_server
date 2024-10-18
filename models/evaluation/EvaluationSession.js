const {STRING, DATE, BOOLEAN, fn, DATEONLY} = require("sequelize");

module.exports = {
  name: 'EVALUATION_SESSIONS',
  define: {
    ACTIVATED: {
      type: BOOLEAN,
			allowNull: false,
    },
    AUTO: {
      type: BOOLEAN,
			allowNull: false,
    },
    EVALUATION_SESSION_ID: {
			type: STRING,
			allowNull: false,
		},
    END_DATE: {
			type: DATEONLY,
      defaultValue: fn('GETDATE'),
      allowNull:true,
    },
    EVALUATION_FORM_ID: STRING,
    LABEL: {
      type: STRING,
      allowNull:false,
    },
    START_DATE: {
			type: DATEONLY,
      defaultValue: fn('GETDATE'),
      allowNull:true,
    },
    STATUS: {
      type: STRING,
      defaultValue: 'REGISTERED',
      allowNull:true,
    },
  }
}
