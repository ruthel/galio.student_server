"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const Setting = require("../../models/common/Setting");
const bcrypt = require('bcryptjs')

module.exports = {
  name: "settings",

  mixins: [DbService],
  adapter,
  model: Setting,

  actions: {
    set: {
      async handler(ctx) {
        try {
          let data = ctx.params
          let result = await this.adapter.model.findOne({
              where: {
                EMPLOYEE_ID: data.MATRICULE
              }
            })
            .then(obj => {
              if (obj)
                return obj.update({LANGUAGE: data.lang})
              return this.adapter.model.create({LANGUAGE: data.lang, EMPLOYEE_ID: data.MATRICULE});
            })
          // ({
          //   LANGUAGE: data.lang
          // }, {
          //   where: {
          //     EMPLOYEE_ID: data.MATRICULE
          //   }
          // });
          if (result)
            return result
          else {
            ctx.meta.$statusCode = 400;
            return {message: 'Bad Request !'}
          }
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
