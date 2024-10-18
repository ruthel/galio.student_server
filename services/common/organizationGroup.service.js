"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const OrganizationGroup = require("../../models/common/OrganizationGroup");
const {Op} = require("sequelize");

module.exports = {
  name: "organizationGroups",

  mixins: [DbService],
  adapter,
  model: OrganizationGroup,

  actions: {
    find: {
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
    delete: {
      params: {
        organization: {type: "string"}
      },
      async handler(ctx) {
        try {
          let result;
          result = await this.adapter.removeMany({ORGA_GROUP_ID: ctx.params.organization});
          if (!result)
            ctx.meta.$statusCode = 400;
          return result
        } catch (e) {
          console.log(e)
          ctx.meta.$statusCode = 500;
        }
      }
    },
    findOne: {
      params: {
        filter: {type: "string"}
      },
      async handler(ctx) {
        let result = await this.adapter.model.findOne({
          where: {
            [Op.or]: [
              {ORGA_GROUP_ID: {[Op.like]: `%${ctx.params.filter}%`}},
              {id: {[Op.like]: `%${ctx.params.filter}%`}}
            ]
          }
        })
				console.log(result)
        result = JSON.parse(JSON.stringify(result))
        return result
      }
    },
    countParentChildren: {
      params: {
        filter: {type: "string"}
      },
      async handler(ctx) {
        return await this.adapter.count({
          ORGA_GROUP_PARENT_ID: ctx.params.filter
        })
      }
    },
    update: {
      params: {
        filter: {type: "string"},
        group: {type: "string"}
      },
      async handler(ctx) {
        return await this.adapter.updateMany({ORGA_GROUP_ID: ctx.params.filter}, {ORGA_GROUP_ID: ctx.params.group})
      }
    },
    add: {
      params: {
        filter: {type: "string"},
        group: {type: "string"}
      },
      async handler(ctx) {
        try {
          const data = ctx.params;
          let exist = await this.adapter.model.findOne({where: {ORGA_GROUP_ID: data.id}})
          if (exist) {
            ctx.meta.$statusCode = 409;
            return {message: 'Already exist !'}
          } else {
            let group = await this.adapter.model.findOne({where: {ORGA_GROUP_ID: data.parentId}})
            JSON.parse(JSON.stringify(group))

            if (!group.ORGA_GROUP_STATUS)
              await this.adapter.model.update({ORGA_GROUP_STATUS: 'G-GROUP'}, {where: {ORGA_GROUP_ID: ctx.params.parentId}})
            else if (group.ORGA_GROUP_STATUS !== 'G-GROUP')
              await this.adapter.model.update({ORGA_GROUP_STATUS: 'G-HYBRID'}, {where: {ORGA_GROUP_ID: ctx.params.parentId}})

            const result = await this.adapter.model.create({
              ORGA_GROUP_ID: data.id,
              ORGA_GROUP_NAME: data.name,
              ORGA_GROUP_PARENT_ID: data.parentId,
              ORGA_GROUP_LEVEL: data.level
            });
            if (result) {
              ctx.meta.$statusCode = 201;
              return result
            } else {
              ctx.meta.$statusCode = 400;
            }
          }
        } catch (e) {
          console.log(e)
          ctx.meta.$statusCode = 500;
        }
      }
    },
    updateOrganization: {
      async handler(ctx) {
        try {
          const data = ctx.params;
          let exist = await this.adapter.model.findOne({where: {ORGA_GROUP_ID: data.id}})
          if (exist) {
            ctx.meta.$statusCode = 409;
            return {message: 'Already exist !'}
          } else {
            let group = await this.adapter.model.findOne({where: {ORGA_GROUP_ID: data.parentId}})
            JSON.parse(JSON.stringify(group))

            if (!group.ORGA_GROUP_STATUS)
              await this.adapter.model.update({ORGA_GROUP_STATUS: 'G-GROUP'}, {where: {ORGA_GROUP_ID: ctx.params.parentId}})
            else if (group.ORGA_GROUP_STATUS !== 'G-GROUP')
              await this.adapter.model.update({ORGA_GROUP_STATUS: 'G-HYBRID'}, {where: {ORGA_GROUP_ID: ctx.params.parentId}})

            const result = await this.adapter.model.create({
              ORGA_GROUP_ID: data.id,
              ORGA_GROUP_NAME: data.name,
              ORGA_GROUP_PARENT_ID: data.parentId,
              ORGA_GROUP_LEVEL: data.level
            });

            if (result) {
              ctx.meta.$statusCode = 201;
              return result
            } else {
              ctx.meta.$statusCode = 400;
            }
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
	async started() {
		await this.adapter.model.sync({force: false})
	},
  stopped() {
  }
};
