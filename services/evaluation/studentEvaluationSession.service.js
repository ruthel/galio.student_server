"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const StudentEvaluationSession = require("../../models/evaluation/StudentEvaluationSession");
const errors = require("../../constants/errors");
const errorCodes = require("../../constants/errorCodes");
const {Op} = require("sequelize");

module.exports = {
	name: "studentEvaluationSessions",

	mixins: [DbService],
	adapter,
	model: StudentEvaluationSession,
	actions: {
		model: {
			async handler() {
				return this.model
			}
		},
		init: {
			async handler(ctx) {
				let exist = await this.adapter.model.findOne({
					where: {
						STUDENT_ID: ctx.params.STUDENT_ID,
						SUBJECT_ID: ctx.params.SUBJECT_ID,
						EMPLOYEE_ID: ctx.params.EMPLOYEE_ID,
						EVALUATION_SESSION_ID: ctx.params.EVALUATION_SESSION_ID
					}
				})
				if (exist)
					return exist
				else {
					let elt = await this.adapter.model.create(ctx.params)
					ctx.meta.$statusCode = 201;
					return elt
				}
			}
		},
		changeStatus: {
			async handler(ctx) {
				try {
					let res = await this.adapter.model.update({STATUS: ctx.params.STATUS}, {where: {EVALUATION_SESSION_ID: ctx.params.EVALUATION_SESSION_ID}})
					if (res && res[0] > 0)
						return res[0]
				} catch (e) {
					console.log(e)
				}
			}
		},
		listSessions: {
			async handler(ctx) {
				return await this.adapter.model.findAll()
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
};
