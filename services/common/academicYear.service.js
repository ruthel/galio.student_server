"use strict";
const AcademicYear = require("../../models/common/AcademicYear");
const DbService = require("moleculer-db");
const adapter = require("../../adapter/mssql");

module.exports = {
  name: "academicYear",
  mixins: [DbService],
  adapter,
  model: AcademicYear,
  actions: {
    findAll: {
      async handler(ctx) {
        try {
          let result;
          result = await this.adapter.model.findAll();
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
      async handler() {
        return this.model
      }
    }
  },

	async started() {
		await this.adapter.model.sync({force: false})
	},

  stopped() {}
};
