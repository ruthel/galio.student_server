"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const EvaluationForm = require("../../models/evaluation/EvaluationForm");
const {Sequelize} = require("sequelize");
const {Logger} = require("sequelize/lib/utils/logger");
const _ = require("lodash");

module.exports = {
	name: "evaluationForms", mixins: [DbService], adapter, model: EvaluationForm, actions: {
		listForms: {
			async handler(ctx) {
				let StudentEvaluationSessions = await this.broker.call('studentEvaluationSessions.model')
				let QuestionForms = await this.broker.call('questionForms.model')
				try {
					this.adapter.model.hasMany(StudentEvaluationSessions, {
						foreignKey: 'EVALUATION_SESSION_ID', sourceKey: 'EVALUATION_SESSION_ID'
					})
				} catch (e) {
				}
				try {
					this.adapter.model.hasMany(QuestionForms, {foreignKey: 'EVALUATION_FORM_ID'})
				} catch (e) {
				}

				let all = await this.adapter.model.findAll({
					attributes: {
						include: [[Sequelize.fn("COUNT", Sequelize.col("STUDENT_EVALUATION_SESSIONs.id")), "USING"],]
					},
					include: [{model: StudentEvaluationSessions, attributes: []},],
					group: ['EVALUATION_FORMS.id', 'EVALUATION_FORMs.LABEL', 'EVALUATION_FORMs.EVALUATION_SESSION_ID', 'EVALUATION_FORMs.createdAt', 'EVALUATION_FORMs.updatedAt']
				})
				let result = []
				for (const elt of all) {
					let d = JSON.parse(JSON.stringify(elt))
					d.QUESTIONS = await QuestionForms.count({where: {EVALUATION_FORM_ID: elt.id}})
					result = [...result, d]
				}
				return result
			}
		},
		remove: {
			async handler(ctx) {
				let QuestionForms = await this.broker.call('questionForms.model')
				await this.adapter.model.destroy({where: {id: ctx.params.id}})
				return await QuestionForms.destroy({where: {EVALUATION_FORM_ID: ctx.params.id}})
			}
		},
		stats: {
			async handler(ctx) {
				let QuestionForms = await this.broker.call('questionForms.model')
				let Employees = await this.broker.call('employees.model')
				let StudentAnswer = await this.broker.call('studentAnswers.model')
				let StudentEvaluationSession = await this.broker.call('studentEvaluationSessions.model')
				let Evaluation = await this.broker.call('evaluations.model')
				let PredefinedQuestionAnswers = await this.broker.call('predefinedQuestionAnswers.model')

				try {
					this.adapter.model.hasMany(QuestionForms, {foreignKey: 'EVALUATION_FORM_ID', sourceKey: 'id'});
				} catch (e) {
					console.log(e)
				}

				try {
					QuestionForms.hasMany(StudentAnswer, {foreignKey: 'QUESTION_FORM_ID'});
					QuestionForms.hasMany(PredefinedQuestionAnswers, {foreignKey: 'QUESTION_FORM_ID'});
					// ApplicationChoi ce.belongsTo(Subject, {foreignKey: 'SUBJECT_ID', targetKey: 'SUBJECT_ID'});
				} catch (e) {
					console.log(e)
				}

				try {
					Evaluation.belongsTo(Employees, {foreignKey: 'EMPLOYEE_ID', targetKey: 'MATRICULE'});
					// ApplicationChoi ce.belongsTo(Subject, {foreignKey: 'SUBJECT_ID', targetKey: 'SUBJECT_ID'});
				} catch (e) {
					console.log(e)
				}

				try {
					StudentAnswer.belongsTo(StudentEvaluationSession, {foreignKey: 'STUDENT_EVALUATION_SESSION_ID'});
					// ApplicationChoi ce.belongsTo(Subject, {foreignKey: 'SUBJECT_ID', targetKey: 'SUBJECT_ID'});
				} catch (e) {
					console.log(e)
				}

				let result = await Evaluation.findAll({
					include: [{model: Employees, attributes: ['LASTNAME', 'FIRSTNAME']}],
					where: {EVALUATION_SESSION_ID: ctx.params.id},
					raw: true,
				})
				result = await Promise.all(result.map(async elt => {
					elt.EVALUATION_FORM = await this.adapter.model.findOne({
						where: {EVALUATION_SESSION_ID: ctx.params.id}, include: [{
							model: QuestionForms,
							include: [{
								model: StudentAnswer,
								include: [{
									model: StudentEvaluationSession, where: {EMPLOYEE_ID: elt.EMPLOYEE_ID}, required: true
								}]
							}, PredefinedQuestionAnswers]
						}]
					})
					return JSON.parse(JSON.stringify(elt))
				}))
				console.log(result)
				return result
			}
		}, duplicate: {
			async handler(ctx) {
				let QuestionForms = await this.broker.call('questionForms.model')
				let copy = await this.adapter.model.findOne({where: {id: ctx.params.id}})
				copy = JSON.parse(JSON.stringify(copy))
				let questions = await QuestionForms.findAll({where: {EVALUATION_FORM_ID: ctx.params.id}})
				delete copy.id
				let newE = await this.adapter.model.create(copy)
				newE = JSON.parse(JSON.stringify(newE))
				questions = JSON.parse(JSON.stringify(questions)).map(e => {
					delete e.id
					e.EVALUATION_FORM_ID = newE.id
					return e
				})
				await QuestionForms.bulkCreate(questions)
			}
		}, saveEvaluationForm: {
			async handler(ctx) {
				let res = await this.adapter.model.create({
					LABEL: ctx.params.formName,
					EVALUATION_SESSION_ID: ctx.params.sessionId
				})
				ctx.meta.$statusCode = 201;
				return res
			}
		}, updateEvaluationForm: {
			async handler(ctx) {
				let res = await this.adapter.model.update({
					LABEL: ctx.params.formName, EVALUATION_SESSION_ID: ctx.params.sessionId
				}, {where: {id: ctx.params.formId}})
				if (res) ctx.meta.$statusCode = 200;
				return this.model
			}
		}, model: {
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
	},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {
	}
};
