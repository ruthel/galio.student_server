"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const EmployeeSubject = require("../../models/course/EmployeeSubject");
const {Op} = require("sequelize");
const axios = require("axios");

module.exports = {
  name: "employeeSubjects",

  mixins: [DbService],
  adapter,
  model: EmployeeSubject,

  actions: {
    getsdasdsa: {
      async handler(ctx) {
        try {

          let r = await axios.get('https://b2i-aca-api.bitang.net/api/teacher/v1/SUBJECTS?ApiKey=iuc3783XX19ezUNRD884296Pc&Year=2021-2022&SchoolID=IUC&TeacherId=20P000825')
          console.log(r.data)
          return r.data

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
}
