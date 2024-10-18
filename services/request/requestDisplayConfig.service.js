"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const RequestDisplayConfig = require("../../models/request/RequestDisplayConfig");

module.exports = {
  name: "requestDisplayConfigs",

  mixins: [DbService],
  adapter,
  model: RequestDisplayConfig,

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
