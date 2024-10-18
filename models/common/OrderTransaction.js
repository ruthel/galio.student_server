const {STRING, INTEGER, BOOLEAN, DATE} = require("sequelize");
module.exports = {
	name: 'ORDER_TRANSACTION',
	define: {
		merchant: STRING,
		candidate: STRING,
		network: STRING,
		accountNumber: STRING,
		orderNumber: STRING,
		transactionType: STRING,
		transactionDate: DATE,
		transactionAmount: INTEGER,
		transactionFees: INTEGER,
		transactionAmountAndFees: INTEGER,
		proxyTransactionId: STRING,
		networkTransactionId: STRING,
		isOkPay: BOOLEAN,
		statusCode: STRING,
		statusMessage: STRING,
		statusDate: DATE
	}
}
