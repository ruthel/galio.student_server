"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const RequestBatch = require("../../models/request/RequestBatch");
const {Op} = require("sequelize");

module.exports = {
	name: "requestBatches",

	mixins: [DbService],
	adapter,
	model: RequestBatch,

	actions: {
		getBatches: {
			params: {
				DEST_ID: {type: 'string'}
			},
			async handler(ctx) {
				try {

					let result = await this.adapter.model.findAll({
						where: {
							[Op.or]: {
								DEST_ID: {[Op.like]: ctx.params.DEST_ID === 'ADM' ? '%%' : ctx.params.DEST_ID},
								SENDER_ID: {[Op.like]: ctx.params.DEST_ID === 'ADM' ? '%%' : ctx.params.DEST_ID}
							}
						}
					})

					if (result)
						return JSON.parse(JSON.stringify(result)).map(b => ({...b, TRANSMITTED: b.TRANSMITTED ? 'YES' : 'NO'}))
					else {
						ctx.meta.$statusCode = 400;
						return {message: 'Unable to execute the query'}
					}
				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 403;
					return e
				}
			}
		},
		confirmBatchReception: {
			async handler(ctx) {
				try {

					let data = ctx.params

					let result = await this.adapter.model.update({
						RBATCH_UNREAD: false
					}, {where: {RBATCH_NUMBER: data.reference}})

					if (result)
						return result
					else {
						ctx.meta.$statusCode = 400;
						return {message: 'Unable to execute the query'}
					}
				} catch (e) {
					ctx.meta.$statusCode = 403;
					return e
				}
			}
		},
		transmit: {
			async handler(ctx) {
				try {
					let data = ctx.params
					let result = await this.adapter.model.update({
						TRANSMITTED: true
					}, {where: {id: {[Op.in]: data.batchesId}}})

					if (result)
						return result
					else {
						ctx.meta.$statusCode = 400;
						return {message: 'Unable to execute the query'}
					}
				} catch (e) {
					ctx.meta.$statusCode = 403;
					return e
				}
			}
		},
		cancel: {
			params: {
				id: {type: 'string'}
			},
			async handler(ctx) {
				try {
					let data = ctx.params
					let RequestStepBatch = await this.broker.call('requestStepBatches.model')
					let Request = await this.broker.call('requests.model')

					let result = await this.adapter.model.findOne({where: {RBATCH_NUMBER: data.id}})
					result = JSON.parse(JSON.stringify(result))
					await this.adapter.model.destroy({where: {RBATCH_NUMBER: data.id}})


					let reqList = await RequestStepBatch.findAll({where: {RBATCH_ID: data.id}})
					await RequestStepBatch.destroy({where: {RBATCH_ID: data.id}})
					reqList = JSON.parse(JSON.stringify(reqList))

					let result2 = await Request.update({
						TRANSMITTED: true,
						REQUEST_UNITY_ID: result.SENDER_ID
					}, {where: {REQUEST_ID: {[Op.in]: reqList.map(e => e.REQUEST_ID)}}})


					if (!result2) {
						ctx.meta.$statusCode = 400;
						return {message: 'Unable to execute the query'}
					}
				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 403;
					return e
				}
			}
		},
		createBatch: {
			async handler(ctx) {
				try {

					let data = ctx.params
					let result = await this.adapter.db.query(`DECLARE @result NVARCHAR(255)
          EXEC [dbo].[INSERTION_REQUEST_BATCH] '${data.array.join(';')}', '${data.group}', '${data.sender}',
               @result OUTPUT
          SELECT @result as REFERENCE`)

					if (result[0][0]) {
						ctx.meta.$statusCode = 201;
						return result[0][0]
					} else {
						ctx.meta.$statusCode = 400;
						return {message: 'Unable to execute the query'}
					}

				} catch (e) {
					ctx.meta.$statusCode = 403;
					console.log(e)
					return e
				}
			}
		},
		model: {
			async handler(ctx) {
				return this.model
			}
		}
	},

	/**
	 * Service started lifecycle event handler
	 */
		async started() {
		await this.adapter.model.sync({force: false})
	}
	,

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {
	}
}
;
