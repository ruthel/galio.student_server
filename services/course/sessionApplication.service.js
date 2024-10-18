"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const SessionApplication = require("../../models/course/SessionApplication");
const {Op} = require("sequelize");

module.exports = {
  name: "sessionApplications",

  mixins: [DbService],
  adapter,
  model: SessionApplication,

  actions: {
    gets: {
      async handler(ctx) {
        try {
          let result = await this.adapter.model.findAll()
          if (!result || result?.length === 0)
            ctx.meta.$statusCode = 204;
          return result
        } catch (e) {
          console.log(e)
          ctx.meta.$statusCode = 500;
        }
      }
    },
    current: {
      async handler(ctx) {
        try {

          let SubjectConstraint = await this.broker.call('subjectConstraints.model')

          try {
            this.adapter.model.belongsTo(SubjectConstraint, {
              foreignKey: 'SUBJECT_CONSTRAINT_ID',
              targetKey: 'id',
              as: 'SubjectConstraint'
            })
          } catch (e) {
          }

          let result = await this.adapter.model.findOne({
            where: {
              ACTIVED: true,
              START_DATE: {[Op.lte]: new Date()},
              [Op.or]: [
                {
                  [Op.and]: {
                    END_DATE: {[Op.gt]: new Date()},
                    MANUAL_CLOSURE: false,
                  }
                }, {
                  MANUAL_CLOSURE: true
                }
              ]
            },
            include: {model: SubjectConstraint, as: 'SubjectConstraint'}
          })

          if (!result || result?.length === 0)
            ctx.meta.$statusCode = 204;
          return result

        } catch (e) {
          console.log(e)
          ctx.meta.$statusCode = 500;
        }
      }
    },
    close: {
      params: {
        session: {type: 'string'}
      },
      async handler(ctx) {
        try {
          let result = await this.adapter.model.update({ACTIVED: false}, {where: {id: ctx.params.session}})
          if (result) {
            return result
          } else {
            ctx.meta.$statusCode = 400;
            return {message: 'Bad request'}
          }
        } catch (e) {
          console.log(e)
          ctx.meta.$statusCode = 500;
        }
      }
    },
    create: {
      async handler(ctx) {
        try {

          let exist = await this.adapter.model.findOne({where: {ACTIVED: true}});
          let sesApp = this.adapter.model.build(ctx.params)
          if (exist) {
            ctx.meta.$statusCode = 409;
            return {message: 'Error occurred because an opened session already exists'}
          }

          sesApp.save().then(obj => {
            ctx.meta.$statusCode = 201;
            return obj
          }).catch(err => {
            ctx.meta.$statusCode = 400;
            return {message: 'Bad request'}
          })
        } catch (e) {
          console.log(e)
          ctx.meta.$statusCode = 500;
        }
      }
    },
    setActivated: {
      async handler(ctx) {
        try {
          let Application = await this.broker.call('applications.model')
          let sesApps = await this.adapter.model.update({ACTIVED: ctx.params.value}, {where: {id: ctx.params.id}})
          let apps = await Application.update({CLOSED: !ctx.params.value}, {where: {SESSION_APPLICATION_ID: ctx.params.id}})
          if (sesApps && apps)
            return sesApps
          else {
            ctx.meta.$statusCode = 400;
            return {message: 'Bad request'}
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
  },

  /**
   * Service stopped lifecycle event handler
   */
  stopped() {
    console.log(`Service ${this.name} stopped`)
  }
}
