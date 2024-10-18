"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const StudentAnswer = require("../../models/evaluation/StudentAnswer");

module.exports = {
	name: "studentAnswers",

	mixins: [DbService],
	adapter,
	model: StudentAnswer,
	actions: {
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
