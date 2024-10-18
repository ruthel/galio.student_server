"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const Subject = require("../../models/common/Subject");
const {Op, Sequelize} = require("sequelize");
const _ = require("lodash");

module.exports = {
  name: "subjects",

  mixins: [DbService],
  adapter,
  model: Subject,

  actions: {
    getSubjectClass: {
      async handler(ctx) {
        try {
          let result = await this.adapter.model.findAll({
            where: {
              CLASS_ID: ctx.params.id,
            },
            attributes: [
              'id',
              'SUBJECT_ID',
              'SUBJECT_NAME',
            ]
          })

          if (!result || result?.length === 0) {
            ctx.meta.$statusCode = 204;
            return []
          }
          return result
        } catch (e) {
          console.log(e)
          ctx.meta.$statusCode = 500;
        }
      }
    },
    getSubjectClassAffected: {
      async handler(ctx) {
        try {
          let EmployeeSubject = await this.broker.call('employeeSubjects.model')

          try {
            this.adapter.model.belongsTo(EmployeeSubject, {
              foreignKey: "CLASS_ID",
              targetKey: 'CLASS_ID',
              as: 'EmployeeSubject'
            });
          } catch (e) {
          }

          let result = await this.adapter.model.findAll({
            where: {
              CLASS_ID: ctx.params.CLASS_ID,
            },
            include: [
              {
                required: true,
                model: EmployeeSubject,
                as: 'EmployeeSubject',
                where: {
                  EMPLOYEE_ID: ctx.params.EMPLOYEE_ID
                },
                attributes: ['EMPLOYEE_ID']
              }
            ],
            attributes: [
				'CLASS_ID',
              'id',
              'SUBJECT_ID',
              'SUBJECT_SHORTNAME',
              'SUBJECT_NAME',
            ]
          })
          result = JSON.parse(JSON.stringify(result))

          if (!result || result?.length === 0) {
            ctx.meta.$statusCode = 204;
            return []
          }
          return _.uniqBy(result, 'SUBJECT_ID')
        } catch (e) {
          console.log(e)
          ctx.meta.$statusCode = 500;
        }
      }
    },
    getByLevel: {
      params: {
        page: {type: "string"}
      },
      async handler(ctx) {
        try {
          if (ctx.params.page) {

            let ApplicationChoice = await this.broker.call('applicationChoices.model')
            let SessionApplication = await this.broker.call('sessionApplications.model')
            let Application = await this.broker.call('applications.model')

            let data;
            const limit = 20;
            const page = ctx.params.page;

            let sessApp;

            if (!ctx.params.session) {
              sessApp = await SessionApplication.findOne({where: {ACTIVED: true}});
              if (!sessApp) {
                ctx.meta.$statusCode = 204;
                return
              }
            }

            let apps = (await Application.findAll({where: {SESSION_APPLICATION_ID: ctx.params.session || sessApp?.id}})).map(e => e.dataValues.id)
            if (!apps) {
              ctx.meta.$statusCode = 204;
              return
            }

            let choices = (await ApplicationChoice.findAll({
              where: {
                APPLICATION_ID: {[Op.in]: apps},
                AFFECTATION: 1
              }
            })).map(e => e.dataValues).filter((elt, i, arr) => arr.filter(e => e.SUBJECT_ID === elt.SUBJECT_ID).length >= 10)
            if (!choices) {
              ctx.meta.$statusCode = 204;
              return
            }

            let filtredOption = {
              id: {
                [Op.notIn]: choices.map(e => e.SUBJECT_ID)
              },
              CLASS_ID: {
                [Op.and]: [
                  {[Op.like]: `%${ctx.params.CYCLE}%`},
                  {[Op.like]: `%${ctx.params.REGIME}%`},
                  {[Op.like]: `%${ctx.params.CLASS}%`}
                ]
              },
              LEVEL_ID: {
                [Op.like]: '%' + ctx.params.LEVEL + '%'
              },
              SUBJECT_NAME: {
                [Op.like]: '%' + ctx.params.SEARCH + '%'
              },
            }

            const total = await this.adapter.model.count({
              where: filtredOption, distinct: true,
              col: 'SUBJECT_NAME'
            })

            let sesApp;
            if (!ctx.params.session)
              sesApp = await SessionApplication.findOne({
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
                }
              });
            else
              sesApp = await SessionApplication.findOne({
                where: {
                  id: ctx.params.session
                }
              });

            if (sesApp) {
              if (sesApp.MANUAL_CLOSURE) {
                data = {
                  rows: await this.adapter.model.findAll({
                    distinct: 'SUBJECT_NAME',
                    limit,
                    offset: (page - 1) * limit + (page > 1 ? 1 : 0),
                    where: filtredOption,
                    attributes: [
                      'SUBJECT_SHORTNAME',
                      'SUBJECT_NAME',
                      'SUBJECT_ID',
                      'LEVEL_ID',
                      'CLASS_ID',
                    ]
                  }),
                  count: Math.ceil(total / limit),
                  total
                }
              } else {
                if (sesApp.END_DATE > new Date()) {
                  data = {
                    rows: await this.adapter.model.findAll({
                      limit,
                      offset: (page - 1) * limit + 1,
                      where: filtredOption,
                      attributes: [
                        'SUBJECT_SHORTNAME',
                        'SUBJECT_NAME',
                        'SUBJECT_ID',
                        'LEVEL_ID',
                        'CLASS_ID',
                      ]
                    }),
                    count: Math.ceil(total / limit),
                    total
                  }
                } else
                  await SessionApplication.update({ACTIVED: false}, {
                    where: {
                      id: sesApp.id
                    }
                  })
              }

              if (data) {
                data.rows = _.uniqBy(data.rows, (item) => (item.SUBJECT_SHORTNAME + item.SUBJECT_ID + item.LEVEL_ID))
                return data
              } else
                ctx.meta.$statusCode = 204;

            } else {
              ctx.meta.$statusCode = 204;
              return {message: 'No actived session application'}
            }
          } else {
            ctx.meta.$statusCode = 400;
            return {message: 'Invalid or missing parameters'}
          }
        } catch (e) {
          console.log(e)
          ctx.meta.$statusCode = 500;
        }
      }
    },
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
