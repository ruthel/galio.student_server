"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const Class = require("../../models/common/Class");
const _ = require("lodash");
const {Sequelize, Op} = require("sequelize");

module.exports = {
  name: "classes",
  mixins: [DbService],
  adapter,
  model: Class,

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
    findOne: {
      params: {
        filter: {type: "string"}
      },
      async handler(ctx) {
        try {

          let result = await this.adapter.model.findOne({
            where: {
              [Op.or]: [
                {CLASS_ID: {[Op.like]: `%${ctx.params.filter}%`}},
                {id: {[Op.like]: `%${ctx.params.filter}%`}}
              ]
            },
          })

          result = JSON.parse(JSON.stringify(result))

          if (result)
            ctx.meta.$statusCode = 204;
          return result
        } catch (e) {
          console.log(e)
          ctx.meta.$statusCode = 500;
        }
      }
    },
    schoolList: {
      async handler(ctx) {
        try {
          let result = await this.adapter.model.findAll({attributes: [[Sequelize.literal('DISTINCT BRANCH_ABREVIATION'), 'BRANCH_ABREVIATION'], 'BRANCH_NAME', 'BRANCH_ID']});
          result = JSON.parse(JSON.stringify(result))

          if (result.length === 0)
            ctx.meta.$statusCode = 204;
          return _.uniqBy(result, 'BRANCH_ID')
        } catch (e) {
          console.log(e)
          ctx.meta.$statusCode = 500;
        }
      }
    },
    schoolListAffected: {
      params: {
        employee: {type: "string"}
      },
      async handler(ctx) {
        try {
          let EmployeeSubject = await this.broker.call('employeeSubjects.model')
          let Subject = await this.broker.call('subjects.model')

          try {
            this.adapter.model.belongsTo(Subject, {
              foreignKey: "CLASS_ID",
              targetKey: 'CLASS_ID',
              as: 'Subject'
            });
          } catch (e) {
          }

          try {
            Subject.belongsTo(EmployeeSubject, {
              foreignKey: "SUBJECT_ID",
              targetKey: 'SUBJECT_ID',
              as: 'EmployeeSubject'
            });
          } catch (e) {
          }

          let result = await this.adapter.model.findAll({
            where: {},
            include: [
              {
                required: true,
                model: Subject,
                as: 'Subject',
                include: [{
                  required: true,
                  model: EmployeeSubject,
                  as: 'EmployeeSubject',
                  where: {
                    EMPLOYEE_ID: ctx.params.employee
                  },
                  attributes: ['EMPLOYEE_ID']
                }],
              }
            ],
            attributes: ['CLASS_ID', 'BRANCH_ABREVIATION', 'BRANCH_NAME', 'BRANCH_ID']
          });

          result = JSON.parse(JSON.stringify(result))
          result = result.map(elt => ({...elt, Subject: null, EmployeeSubject: elt.Subject.EmployeeSubject}))
          if (result.length === 0)
            ctx.meta.$statusCode = 204;
          return _.uniqBy(result, 'BRANCH_ID')
        } catch (e) {
          console.log(e)
          ctx.meta.$statusCode = 500;
        }
      }
    },
    classOfSchool: {
      params: {
        id: {type: "string"},
      },
      async handler(ctx) {
        try {
          let result;
          result = await this.adapter.model.findAll({
            where: {BRANCH_ABREVIATION: ctx.params.id}
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
    classOfSchoolAffected: {
      params: {
        school: {type: "string"},
        employee: {type: "string"}
      },
      async handler(ctx) {
        try {
          let EmployeeSubject = await this.broker.call('employeeSubjects.model')
          let Subject = await this.broker.call('subjects.model')

          try {
            this.adapter.model.belongsTo(Subject, {
              foreignKey: "CLASS_ID",
              targetKey: 'CLASS_ID',
              as: 'Subject'
            });
          } catch (e) {
            console.log(e)
          }

          try {
            Subject.belongsTo(EmployeeSubject, {
              foreignKey: "SUBJECT_ID",
              targetKey: 'SUBJECT_ID',
              as: 'EmployeeSubject'
            });
          } catch (e) {
            console.log(e)
          }

          let result = await this.adapter.model.findAll({
            where: {BRANCH_ABREVIATION: ctx.params.school},
            include: [
              {
                required: true,
                model: Subject,
                as: 'Subject',
                include: [{
                  required: true,
                  model: EmployeeSubject,
                  as: 'EmployeeSubject',
                  where: {
                    EMPLOYEE_ID: ctx.params.employee
                  },
                  attributes: ['EMPLOYEE_ID']
                }],
              }
            ],
            attributes: ['CLASS_ID', 'CLASS_NAME']
          })

          result = JSON.parse(JSON.stringify(result))

          if (result.length === 0)
            ctx.meta.$statusCode = 204;
          return _.uniqBy(result, 'CLASS_ID')
        } catch (e) {
          console.log(e)
          ctx.meta.$statusCode = 500;
        }
      }
    },
    setClassDepartment: {
      async handler(ctx) {
        try {

					console.log(ctx.params.department)
          let group = await this.broker.call('organizationGroups.findOne', {filter: ctx.params.department})
          let data = await this.broker.call('classes.findOne', {filter: ctx.params.classId.toString()})

          let oldGroupChildren;
          let oldGroupClasses;
          let result;

          if (data) {
            let grp;

            oldGroupChildren = await this.broker.call('organizationGroups.countParentChildren', {filter: group.ORGA_GROUP_ID});
            oldGroupClasses = await this.adapter.count({query: {ORGANIZATION_GROUP_ID: group.ORGA_GROUP_ID}});

            if (oldGroupChildren > 0 && oldGroupClasses > 0)
              grp = 'G-HYBRID';
            else if (oldGroupChildren > 0 && oldGroupClasses === 0)
              grp = 'G-GROUP';
            else if (oldGroupChildren === 0 && oldGroupClasses > 0)
              grp = 'G-CLASS';

            await this.broker.call('organizationGroups.update', {
              filter: group.ORGA_GROUP_ID,
              group: grp
            });


            if (group)
              if (!group.ORGA_GROUP_STATUS)
                grp = 'G-CLASS';
              else if (group.ORGA_GROUP_STATUS !== 'G-CLASS')
                grp = 'G-HYBRID';

            await this.broker.call('organizationGroups.update', {
              filter: group.ORGA_GROUP_ID,
              group: grp
            });

            result = await this.adapter.updateMany({id: ctx.params.classId}, {ORGANIZATION_GROUP_ID: ctx.params.department});
            if (!result)
              ctx.meta.$statusCode = 400;
            return result
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
}
