"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const StudentSubject = require("../../models/evaluation/StudentSubject");

module.exports = {
	name: "studentSubjects",
	mixins: [DbService],
	adapter,
	model: StudentSubject,
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
