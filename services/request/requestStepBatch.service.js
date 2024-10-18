"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const RequestStepBatch = require("../../models/request/RequestStepBatch");

module.exports = {
  name: "requestStepBatches",

  mixins: [DbService],
  adapter,
  model: RequestStepBatch,

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
