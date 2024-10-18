"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const Candidate = require("../../models/common/Candidate");
const base = require('base-converter');
const {welcomeEmail, emailAuth} = require("../../helpers/mail");

module.exports = {
	name: "candidates",

	mixins: [DbService],
	adapter,
	model: Candidate,

	actions: {
		create: {
			async handler(ctx) {
				try {
					let data = ctx.params
					let result = await this.adapter.model.create({...data, MATRICULE: base.decTo62(Date.now())})
					result = JSON.parse(JSON.stringify(result))
					if (result) {
						ctx.meta.$statusCode = 201;
						await welcomeEmail({
							email: data.EMAIL,
							emailText: 'REGISTRATION AS CANDIDATE',
							emailsSubject: 'REGISTRATION AS CANDIDATE',
							data: result
						})
					}
					return result
				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
					return
				}
			}
		},
		authEmail: {
			async handler(ctx) {
				try {
					await emailAuth(ctx.params.email)
				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
					return
				}
			}
		},
		model: {
			async handler() {
				return this.model
			}
		}
	},

	/**
	 * Service started lifecycle event handler
	 */
	started() {
		this.adapter.model.sync({force: false})
	}
	,

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {
	}
}
;
