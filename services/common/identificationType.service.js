"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const IdentificationType = require("../../models/common/IdentificationType");

module.exports = {
  name: "identificationTypes",

  mixins: [DbService],
  adapter,
  model: IdentificationType,

  actions: {
    find: {
      async handler(ctx) {
        try {
          let result;
          result = await this.adapter.find();
          if (result.length === 0)
            ctx.meta.$statusCode = 204;
          return result
        } catch (e) {
          console.log(e)
          ctx.meta.$statusCode = 500;
        }
      }
    },
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
  },

  /**
   * Service stopped lifecycle event handler
   */
  stopped() {
  }
};
