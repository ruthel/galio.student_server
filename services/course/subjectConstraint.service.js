"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const SubjectConstraint = require("../../models/course/SubjectConstraint");

module.exports = {
	name: "subjectConstraints",

	mixins: [DbService],
	adapter,
	model: SubjectConstraint,
	actions: {
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
