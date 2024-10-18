"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const PaymentMode = require("../../models/common/PaymentMode");

module.exports = {
  name: "paymentModes",

  mixins: [DbService],
  adapter,
  model: PaymentMode,

  actions: {
    find: {
      async handler(ctx) {
        try {

          let result = await this.adapter.model.findAll();
          if (!result || result.length === 0) {
            ctx.meta.$statusCode = 204
          } else
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
  }
  ,

  /**
   * Service stopped lifecycle event handler
   */
  stopped() {
  }
}
;
