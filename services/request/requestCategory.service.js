"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const RequestCategory = require("../../models/request/RequestCategory");
const _ = require("lodash");

module.exports = {
  name: "requestsCategories",

  mixins: [DbService],
  adapter,
  model: RequestCategory,

  actions: {
    findCategories: {
      async handler(ctx) {
        try {

          let RequestDisplayConfig = await this.broker.call('requestDisplayConfigs.model')

          try {
            this.adapter.model.belongsTo(RequestDisplayConfig, {
              foreignKey: 'ID_SCAT',
              targetKey: 'REQUEST_CATEGORY_ID',
              as: 'RequestDisplayConfig'
            })
          } catch (e) {
          }

          let result = await this.adapter.model.findAll({
            include: [{
              model: RequestDisplayConfig,
              as: 'RequestDisplayConfig'
            }]
          });

          result = JSON.parse(JSON.stringify(result))

          let distinct = _.uniqBy(result, 'CATEGORIE')
          distinct = distinct.map(e => {
            return {
              ...e,
              sousCategories: result.filter(elt => e.CATEGORIE === elt.CATEGORIE).map(elt => {
                return {...elt, REQUEST_DISPCONFIG: elt.RequestDisplayConfig}
              })
            }
          })

          if (distinct.length === 0)
            ctx.meta.$statusCode = 204;
          return distinct
        } catch (e) {
          console.log(e)
          ctx.meta.$statusCode = 500;
        }
      }
    },
    findOne: {
      params: {
        filter: {type: "string"},
      },
      async handler(ctx) {
        console.log(ctx)
        try {

          let RequestDisplayConfig = await this.broker.call('requestDisplayConfigs.model')

          this.adapter.model.hasOne(RequestDisplayConfig, {foreignKey: 'REQUEST_CATEGORY_ID', targetKey: 'ID_SCAT'})

          const result = await Request.findAll({include: [{model: RequestDisplayConfig, as: 'RequestDisplayConfig'}]});
          const catAll = result.map(elt => {
            return {
              ID_CAT: elt.ID_CAT,
              value: elt.CATEGORIE,
              value_en: elt.CATEGORIE_EN,
              CAT_DESCRIPTION: elt.CAT_DESCRIPTION,
              CAT_DESCRIPTION_EN: elt.CAT_DESCRIPTION_EN,
            }
          })

          let catDistinct = [];
          catAll.forEach(elt => {
            if (!catDistinct.find(e => e.value === elt.value))
              catDistinct.push(elt)
          })

          console.log(catDistinct)

          catDistinct = catDistinct.map(e => {
            let data = {...e}
            data.sousCategories = result.filter(elt => e.value === elt.CATEGORIE).map(elt => {
              return {
                id: elt.id,
                ID_SCAT: elt.ID_SCAT,
                S_CATEGORIE: elt.S_CATEGORIE,
                S_CATEGORIE_EN: elt.S_CATEGORIE_EN,
                REQUEST_DISPCONFIG: elt.RequestDispConfig,
                SCAT_DESCRIPTION: elt.SCAT_DESCRIPTION,
                SCAT_DESCRIPTION_EN: elt.SCAT_DESCRIPTION_EN,
                createdAt: elt.createdAt,
                updatedAt: elt.updatedAt,
              }

            })
            return data
          })

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
  }
  ,

  /**
   * Service stopped lifecycle event handler
   */
  stopped() {
  }
}
;
