"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const Evaluation = require("../../models/evaluation/Evaluation");

module.exports = {
	name: "evaluations",

	mixins: [DbService],
	adapter,
	model: Evaluation,
	actions: {
		listAll: {
			async handler(ctx) {
				let all = await this.adapter.model.findAll();
				return all
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
