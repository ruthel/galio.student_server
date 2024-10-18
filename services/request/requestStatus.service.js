"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const RequestStatus = require("../../models/request/RequestStatus");

module.exports = {
	name: "requestStatus",

	mixins: [DbService],
	adapter,
	model: RequestStatus,

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
