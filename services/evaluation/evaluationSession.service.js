"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const EvaluationSession = require("../../models/evaluation/EvaluationSession");
const errors = require("../../constants/errors");
const errorCodes = require("../../constants/errorCodes");
const {Op} = require("sequelize");

module.exports = {
  name: "evaluationSessions",

  mixins: [DbService],
  adapter,
  model: EvaluationSession,
  actions: {
    model: {
      async handler() {
        return this.model
      }
    },
    newSession: {
      async handler(ctx) {
        try {
					let elt = this.adapter.model.build({...ctx.params, ACTIVATED: true, AUTO: true})
          let exist = await this.adapter.model.count({where: {EVALUATION_SESSION_ID: elt.EVALUATION_SESSION_ID}})

					let Subject = await this.broker.call('subjects.model')
					let EmployeeSubject = await this.broker.call('employeeSubjects.model')
					let Evaluation = await this.broker.call('evaluations.model')

					let subjectsList = JSON.parse(JSON.stringify(await Subject.findAll({
            where: {
              CLASS_ID: {[Op.like]: `%${ctx.params.CLASS_ID}%`},
              SUBJECT_ID: {[Op.like]: `%${ctx.params.SUBJECT_ID}%`}
            },
            attributes: ['id', 'CLASS_ID', 'SUBJECT_ID', 'SUBJECT_NAME']
					})))

					let employeeSubjectsList = await EmployeeSubject.findAll(
            {
							where: {SUBJECT_ID: {[Op.in]: subjectsList.map(e => e.SUBJECT_ID)}},
            })
					employeeSubjectsList = JSON.parse(JSON.stringify(employeeSubjectsList))

          if (exist)
            return errors(errorCodes.notUniq, ctx)
          else {
            elt.save().then(async res => {
							Evaluation.bulkCreate(employeeSubjectsList.map(employee_subject => ({
								...employee_subject,
								CLASS_ID: ctx.params.CLASS_ID,
								EVALUATION_SESSION_ID: res.EVALUATION_SESSION_ID
							}))).then(() => {
                return {Ok: true}
              })
            })
          }
        } catch (e) {
          console.log(e)
        }
      }
    },
    changeStatus: {
      async handler(ctx) {
        try {
          let res = await this.adapter.model.update({STATUS: ctx.params.STATUS}, {where: {EVALUATION_SESSION_ID: ctx.params.EVALUATION_SESSION_ID}})
          if (res && res[0] > 0)
            return res[0]
        } catch (e) {
          console.log(e)
        }
      }
    },
		cancel: {
      async handler(ctx) {
        try {
          let res = await this.adapter.model.update({ACTIVATED: false}, {where: {id: ctx.params.id}})
          if (res && res[0] > 0)
            return res[0]
        } catch (e) {
          console.log(e)
        }
      }
    },
    listSessions: {
      async handler(ctx) {
				let all = await this.adapter.model.findAll();
        return all
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
};
