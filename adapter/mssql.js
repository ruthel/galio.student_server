const SqlAdapter = require("moleculer-db-adapter-sequelize");
module.exports =  new SqlAdapter({
	dialect: "mssql",
	// host: "172.20.0.2",
	host: "65.108.126.45",
	port: 1433,
	username: "sa",
	password: "2021MyMsSQL",
	// database: "GALIO",
	database: "GALIO_TEST",
	logging: false,
})
