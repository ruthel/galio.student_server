"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const ApplicationChoice = require("../../models/course/ApplicationChoice");
const {Op} = require("sequelize");
const _ = require("lodash");

module.exports = {
  name: "applicationChoices",
  mixins: [DbService],
  adapter,
  model: ApplicationChoice,

  actions: {
    clear: {
      params: {
        application: {type: 'string'}
      },
      async handler(ctx) {
        try {
          return await this.adapter.model.destroy({
            where: {
              APPLICATION_ID: ctx.params.application,
              AFFECTATION: {[Op.not]: 1}
            }
          })
        } catch (e) {
          console.log(e)
          ctx.meta.$statusCode = 500;
        }
      }
    },
    getTeachers: {
      params: {
        subject: {type: 'string'},
        organisation: {type: 'string'},
        session: {type: 'string'}
      },
      async handler(ctx) {
        try {

          let Application = await this.broker.call('applications.model')
          let Subject = await this.broker.call('subjects.model')
          let Employee = await this.broker.call('employees.model')
          let Class = await this.broker.call('classes.model')

          try {
            this.adapter.model.belongsTo(Subject, {
              foreignKey: 'SUBJECT_ID',
              targetKey: 'SUBJECT_ID',
              as: 'Subject',
            })
          } catch (e) {
          }
          try {
            this.adapter.model.belongsTo(Application, {
              foreignKey: 'APPLICATION_ID',
              targetKey: 'id',
              as: 'Application',
            })
          } catch (e) {
          }
          try {
            Application.belongsTo(Employee, {
              foreignKey: 'EMPLOYEE_ID',
              targetKey: 'MATRICULE',
              as: 'Employee',
            })
          } catch (e) {
          }
          try {
            Subject.belongsTo(Class, {
              foreignKey: 'CLASS_ID',
              targetKey: 'CLASS_ID',
              as: 'Class',
            })
          } catch (e) {
          }
          let result = await this.adapter.model.findAll({
            include: [
              {
                model: Subject,
                as: 'Subject',
                required: true,
                where: {
                  SUBJECT_ID: ctx.params.subject
                },
                // attributes: ['id', 'SUBJECT_ID', 'SUBJECT_NAME'],
                include: [
                  {
                    required: true,
                    model: Class,
                    as: 'Class',
                    where: {
                      ORGANIZATION_GROUP_ID: {[Op.like]: `%${ctx.params.organisation === 'IUC' ? '' : ctx.params.organisation}%`}
                    },
                  }
                ]
              },
              {
                model: Application,
                as: 'Application',
                required: true,
                attributes: ['id'],
                include: [{
                  required: true,
                  model: Employee,
                  as: 'Employee'
                }],
                where: {
                  SESSION_APPLICATION_ID: ctx.params.session
                }
              }
            ],
          })

          if (result)
            return result
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
    gets: {
      params: {
        organisation: {type: 'string'},
        application: {type: 'string'},
      },
      async handler(ctx) {
        try {

          let Subject = await this.broker.call('subjects.model')
          try {
            this.adapter.model.belongsTo(Subject, {
              foreignKey: 'SUBJECT_ID',
              as: 'Subject',
              targetKey: 'SUBJECT_ID'
            })
          } catch (e) {

          }
          let filter = ''

          switch (ctx.params.organisation) {
            case 'IUC':
              filter = ''
              break
            case '3IAC':
              filter = 'TI'
              break
            case 'ICIA':
              filter = 'IC'
              break
            case 'PISTI':
              filter = 'PI'
              break
            case 'SEAS':
              filter = 'SE'
              break
            case 'ISTDI':
              filter = 'IS'
              break
            default:
              filter = ''
              break
          }

          console.log(ctx.params.application)

          let result = await this.adapter.model.findAll({
            where: {
              APPLICATION_ID: ctx.params.application,
              // AFFECTATION: {[Op.not]: 1},
            },
            include: [
              {
                model: Subject,
                as: 'Subject',
                where: {
                  SUBJECT_ID: {
                    [Op.like]: `${filter}%`
                  }
                }
              }
            ],
          })

          if (result)
            return result
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
    listAll: {
      async handler(ctx) {
        try {

          let Application = await this.broker.call('applications.model')
          let Subject = await this.broker.call('subjects.model')
          let Employee = await this.broker.call('employees.model')

          this.adapter.model.belongsTo(Subject, {
            as: 'Subject',
            foreignKey: 'SUBJECT_ID',
            targetKey: 'SUBJECT_ID',
          })

          this.adapter.model.belongsTo(Application, {
            foreignKey: 'APPLICATION_ID',
            as: 'Application',
            targetKey: 'id',
          })

          Application.belongsTo(Employee, {
            foreignKey: 'EMPLOYEE_ID',
            as: 'Employee',
            targetKey: 'MATRICULE',
          })

          let result = await this.adapter.model.findAll({
            where: {CLOSURE: true},
            include: [
              {
                model: Subject,
                as: 'Subject',
                attributes: [
                  "id",
                  "CLASS_ID",
                  "SUBJECT_ID",
                  "SUBJECT_NAME",
                  "SUBJECT_SHORTNAME",
                  "SUBJECT_ABREVIATION",
                  "SUBJECT_VH_AB_INITIAL",
                  "SUBJECT_VH_CM_INITIAL",
                  "SUBJECT_VH_EX_INITIAL",
                  "SUBJECT_VH_TD_INITIAL",
                  "SUBJECT_VH_MT_INITIAL",
                  "SUBJECT_VH_TP_INITIAL",
                ]
              },
              {
                model: Application,
                as: 'Application',
                include: [
                  {
                    as: 'Employee',
                    model: Employee,
                    attributes: ['MATRICULE', 'FIRSTNAME', 'LASTNAME', 'id']
                  }
                ]
              }]
          });

          if (result)
            return result
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
    predicateAffectation: {
      async handler(ctx) {
        try {

          console.log(ctx.params)

          let all = await this.adapter.model.findAll({attributes: ['APPLICATION_ID', 'SUBJECT_ID']});
          all = JSON.parse(JSON.stringify(all))
          all = _.uniqBy(all, item => item.APPLICATION_ID + item.SUBJECT_ID)
          all = all.filter((elt, index, arr) => {
            return arr.filter(e2 => e2.APPLICATION_ID === elt.APPLICATION_ID).length <= ctx.params.delimiter
          })
          let res = await this.adapter.model.update({AFFECTATION: 1}, {where: {APPLICATION_ID: {[Op.in]: all.map(elt => elt.APPLICATION_ID)}}})
          if (res && res[0] > 0)
            return res


        } catch (e) {
          console.log(e)
          ctx.meta.$statusCode = 500;
        }
      }
    },
    allOlder: {
      params: {
        matricule: {type: 'string'},
      },
      async handler(ctx) {
        try {

          let Application = await this.broker.call('applications.model')
          let Subject = await this.broker.call('subjects.model')

          try {
            this.adapter.model.belongsTo(Subject, {
              foreignKey: 'SUBJECT_ID',
              targetKey: 'SUBJECT_ID',
              as: 'Subject'
            })
          } catch (e) {

          }

          let oldApps = await Application.findAll({
            attributes: ['id'],
            where: {
              EMPLOYEE_ID: ctx.params.matricule,
              CLOSED: true
            }
          })

          if (oldApps)
            oldApps = JSON.parse(JSON.stringify(oldApps))

          let result = await this.adapter.model.findAll({
            where: {
              AFFECTATION: 1,
              APPLICATION_ID: {[Op.in]: oldApps.map(app => app.id)}
            },
            attributes: ['AFFECTATION'],
            include: [
              {
                model: Subject,
                as: 'Subject'
                // attributes: ['SUBJECT_ID', 'id'],
              }
            ]
          });

          if (result) {
            result = JSON.parse(JSON.stringify(result))
            result = _.uniqBy(result.map(elt => elt['Subject']), (item) => item.id + item.SUBJECT_ID)
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
    createOrUpdate: {
      async handler(ctx) {
        try {

          let SessionApplication = await this.broker.call('sessionApplications.model')

          let existSes;
          if (!ctx.params.session)
            existSes = await SessionApplication.findOne({where: {ACTIVED: true}});
          else
            existSes = await SessionApplication.findOne({where: {id: ctx.params.session}});

          if (existSes) {
            let existing = (await this.adapter.model.findAll({
              where: {
                APPLICATION_ID: ctx.params.application,
                SUBJECT_ID: {[Op.in]: ctx.params.subjects.map(e => e.SUBJECT_ID)},
                CATEGORY: {[Op.in]: ctx.params.subjects.map(e => e.CATEGORY)}
              }
            }))?.map(subject => {
              return {SUBJECT_ID: subject?.dataValues?.SUBJECT_ID, CATEGORY: subject?.dataValues?.CATEGORY}
              // return {SUBJECT_ID: subject?.dataValues?.SUBJECT_ID}
            })


            let removed = (await this.adapter.model.findAll({
              where: {
                APPLICATION_ID: ctx.params.application,
                id: {[Op.notIn]: ctx.params.subjects.map(e => e.id)},
              }
            }))?.map(subject => ({
              SUBJECT_ID: subject?.dataValues?.SUBJECT_ID,
              CATEGORY: subject?.dataValues?.CATEGORY
            }))

            if (existing && removed)
              await this.adapter.model.destroy({
                where: {
                  APPLICATION_ID: ctx.params.application,
                  SUBJECT_ID: {[Op.in]: removed.map(e => e.SUBJECT_ID)},
                  CATEGORY: {[Op.in]: removed.map(e => e.CATEGORY)}
                }
              })

            let arra = ctx.params.subjects?.filter(subject => !existing.find(elt => elt.SUBJECT_ID === subject.SUBJECT_ID && elt.CATEGORY === subject.CATEGORY))?.map(subject => ({
              // let arra = ctx.params.subjects?.filter(subject => !existing.find(elt => elt.SUBJECT_ID === subject.SUBJECT_ID))?.map(subject => ({
              SUBJECT_ID: subject.SUBJECT_ID,
              CATEGORY: subject.CATEGORY,
              APPLICATION_ID: ctx.params.application,
              SUP_AUTHOR: ctx.params.supAuthor,
            }))

            this.adapter.model.bulkCreate(arra).then(ok2 => {
              return ok2
            })

          } else {
            ctx.meta.$statusCode = 401;
            return {message: "No session session actived"}
          }

        } catch (e) {
          console.log(e)
          ctx.meta.$statusCode = 500;
        }
      }
    },
    closeAffectations: {
      async handler(ctx) {
        try {
          let up = await this.adapter.model.update({CLOSURE: true}, {where: {id: {[Op.in]: ctx.params.data.map(elt => elt.id)}}})
          if (up[0] > 0)
            return {message: "update successfully"}
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
    affectTeacherToClass: {
      async handler(ctx) {
        try {
          let up = await this.adapter.model.update({AFFECTED_CLASS_ID: ctx.params.CLASS_ID}, {
            where: {
              SUBJECT_ID: ctx.params.SUBJECT_ID,
              APPLICATION_ID: ctx.params.appId
            }
          })
          console.log(ctx.params, up)
          // if (up[0] > 0)
          //   return {message: "update successfully"}
          // else {
          //   ctx.meta.$statusCode = 400;
          //   return {message: 'Bad request'}
          // }
        } catch
          (e) {
          console.log(e)
          ctx.meta.$statusCode = 500;
        }
      }
    },
    affect: {
      async handler(ctx) {
        try {
          let up = await this.adapter.model.update({AFFECTATION: ctx.params.value}, {where: {id: ctx.params.choice}})
          if (up[0] > 0)
            return {message: "update successfully"}
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
    byClass: {
      async handler(ctx) {
        try {

          let Subject = await this.broker.call('subjects.model')
          let Class = await this.broker.call('classes.model')
          try {
            this.adapter.model.belongsTo(Subject, {
              foreignKey: 'SUBJECT_ID',
              targetKey: 'SUBJECT_ID',
              as: 'Subject',
            })
          } catch (e) {
          }
          try {
            Subject.belongsTo(Class, {
              foreignKey: 'CLASS_ID',
              targetKey: 'CLASS_ID',
              as: 'Class',
            })
          } catch (e) {
          }

          let result = await this.adapter.model.findAll({
            include: [
              {
                model: Subject,
                as: 'Subject',
                required: true,
                include: {
                  model: Class,
                  as: "Class",
                  required: true,
                  where: {
                    ORGANIZATION_GROUP_ID: ctx.params.organization
                  },
                  // where: {
                  //   CLASS_ID: ctx.params.classes
                }
              }
            ],
          })

          if (result)
            return result
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
    byClass2: {
      async handler(ctx) {
        try {

          let Subject = await this.broker.call('subjects.model')
          let Application = await this.broker.call('applications.model')
          let Employee = await this.broker.call('employees.model')
          let Class = await this.broker.call('classes.model')

          try {
            this.adapter.model.belongsTo(Subject, {
              foreignKey: 'SUBJECT_ID',
              targetKey: 'SUBJECT_ID',
              as: 'Subject',
            })
          } catch (e) {
          }

          try {
            this.adapter.model.belongsTo(Application, {
              foreignKey: 'APPLICATION_ID',
              targetKey: 'id',
              as: 'Application',
            })
          } catch (e) {
          }

          try {
            Application.belongsTo(Employee, {
              foreignKey: 'EMPLOYEE_ID',
              as: 'Employee',
              targetKey: 'MATRICULE',
            })
          } catch (e) {
          }
          try {
            Subject.belongsTo(Class, {
              foreignKey: 'CLASS_ID',
              targetKey: 'CLASS_ID',
              as: 'Class',
            })
          } catch (e) {
          }

          let result = await this.adapter.model.findAll({
            include: [
              {
                model: Subject,
                as: 'Subject',
                required: true,
                include: {
                  model: Class,
                  as: "Class",
                  required: true,
                  where: {
                    ORGANIZATION_GROUP_ID: ctx.params.organization
                  },
                }
              },
              {
                model: Application,
                as: 'Application',
                required: true,
                include: {
                  model: Employee,
                  required: true,
                  as: 'Employee'
                }
              }
            ],
          })

          console.log(result)

          if (result)
            return result
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
  }
}
