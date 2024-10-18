"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const LabelDecision = require("../../models/common/LabelDecision");

module.exports = {
  name: "labelDecisions",

  mixins: [DbService],
  adapter,
  model: LabelDecision,

  actions: {
    getDecisions: {
      async handler(ctx) {
        try {
          let data = ctx.params
          console.log(ctx.params)
          let result = await this.adapter.model.findAll({
            where: {
              LIB_UNITY_ID: data.UNITY,
              LIB_DEST_ID: data.DEST,
              REQUEST_CATEGORY_ID: data.CAT_REQUEST,
            }
          });
          result = JSON.parse(JSON.stringify(result))
          if (result)
            return result
          else
            ctx.meta.$statusCode = 204;

        } catch (e) {
          ctx.meta.$statusCode = 403;
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
