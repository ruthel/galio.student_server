"use strict";
const OrderTransactionService = require("../../models/common/OrderTransaction");
const DbService = require("moleculer-db");
const adapter = require("../../adapter/mssql");
const {orderTransactionMail} = require("../../helpers/mail");

module.exports = {
	name: "orderTransaction",
	mixins: [DbService],
	adapter,
	model: OrderTransactionService,
	actions: {
		add: {
			async handler(ctx) {
				let Candidates = await this.broker.call('candidates.model')
				let result = await this.adapter.model.create({...ctx.params})
				let candidate = await Candidates.findOne({where: {MATRICULE: ctx.params.candidate}})
				candidate = JSON.parse(JSON.stringify(candidate))
				if (result) {
					try {
						await orderTransactionMail({...candidate, ...ctx.params})
					} catch (e) {
						console.log(e)
					}
					return result
				} else
					ctx.meta.$statusCode = 400;
			}
		},
		model: {
			async handler() {
				return this.model
			}
		}
	},

	async started() {
		await this.adapter.model.sync({force: false})
	},

	stopped() {
	}
};
