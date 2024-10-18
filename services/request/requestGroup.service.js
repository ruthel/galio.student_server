"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const RequestGroup = require("../../models/request/RequestGroup");
const _ = require("lodash");

module.exports = {
  name: "requestGroups",

  mixins: [DbService],
  adapter,
  model: RequestGroup,

  actions: {
    getRequestGroup: {
      async handler(ctx) {
        try {

          let User = await this.broker.call('users.model');
          try {
            this.adapter.model.belongsTo(User, {foreignKey: 'REQ_GROUP_MANAGER', targetKey: 'USERNAME'});
          } catch (e) {
          }
          let result = await this.adapter.model.findAll({
              include: User
            }
          )

          if (result)
            return result
          else
            ctx.meta.$statusCode = 204;
        } catch (e) {
          console.log(e)
          ctx.meta.$statusCode = 500;
        }
      }
    },
    updateRequestGroup: {
      async handler(ctx) {
        try {
          const keys = ["id", "REQUEST_GROUP_ID", "REQ_GROUP_NAME", "REQ_GROUP_MANAGER"]

          for (const eltKey of keys)
            if (!Object.keys(ctx.params).includes(eltKey)) {
              ctx.meta.$statusCode = 400;
              return {message: 'missing or incorrect parameters'}
            }

          let {id, REQUEST_GROUP_ID, REQ_GROUP_NAME, REQ_GROUP_MANAGER} = ctx.params
          let result = await this.adapter.model.update({
            REQUEST_GROUP_ID,
            REQ_GROUP_NAME,
            REQ_GROUP_MANAGER
          }, {where: {id}})

          if (result)
            return result
          else {
            ctx.meta.$statusCode = 400;
            return {message: 'missing or incorrect parameters'}
          }
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
