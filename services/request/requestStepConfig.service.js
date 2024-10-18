"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const RequestStepConfig = require("../../models/request/RequestStepConfig");
const {Op} = require("sequelize");

module.exports = {
  name: "requestStepConfigs",

  mixins: [DbService],
  adapter,
  model: RequestStepConfig,

  settings: {
    populates: {
      "RSTEP_CAT_ID": {
        field: "RSTEP_CAT_ID",
        action: "requestsCategories.get",
        params: {
          fields: "filter"
        }
      },
    },
  },

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
    findRequestStepUserConfig: {
      async handler(ctx) {

        let RequestCategory = await this.broker.call('requestsCategories.model');
        let RequestGroup = await this.broker.call('requestGroups.model');
        try {
          this.adapter.model.belongsTo(RequestCategory, {
            foreignKey: 'RSTEP_CAT_ID',
            targetKey: 'ID_SCAT',
            as: 'RequestCategory'
          });
        } catch (e) {
        }

        try {
          this.adapter.model.belongsTo(RequestGroup, {
            foreignKey: 'RSTEP_DEST_ID',
            targetKey: 'REQUEST_GROUP_ID',
            as: 'RequestGroup'
          });
        } catch (e) {
        }

        let result = await this.adapter.model.findAll({
            include: [
              {
                model: RequestCategory,
                as: 'RequestCategory'
              },
              {
                model: RequestGroup,
                as: 'RequestGroup'
              }
            ],
            where: {
              [Op.and]: [
                {RSTEP_CAT_ID: ctx.params.REQUEST_CATEGORY_ID},
                {RSTEP_UNITY_ID: ctx.params.RSTEP_UNITY_ID}
              ]
            }
          }
        )
        result = JSON.parse(JSON.stringify(result))
        console.log(result)
        return result
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
