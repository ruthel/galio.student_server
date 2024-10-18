"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const PredefinedQuestionAnswer = require("../../models/evaluation/PredifinedQuestionAnswer");

module.exports = {
	name: "predefinedQuestionAnswers",

	mixins: [DbService],
	adapter,
	model: PredefinedQuestionAnswer,
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
