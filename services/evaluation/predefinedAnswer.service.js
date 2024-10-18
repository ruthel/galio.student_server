"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const PredifinedAnswer = require("../../models/evaluation/PredifinedAnswer");

module.exports = {
	name: "predefinedAnswers",

	mixins: [DbService],
	adapter,
	model: PredifinedAnswer,
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
