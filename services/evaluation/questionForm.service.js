"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const QuestionForm = require("../../models/evaluation/QuestionForm");
const PredefinedQuestionAnswer = require("../../models/evaluation/PredifinedQuestionAnswer");

module.exports = {
	name: "questionForms",
	mixins: [DbService],
	adapter,
	model: QuestionForm,
	actions: {
		loadAllQuestions: {
			async handler(ctx) {
				let PredefinedQuestionAnswer = await this.broker.call('predefinedQuestionAnswers.model')

				try {
					this.adapter.model.hasMany(PredefinedQuestionAnswer, {foreignKey: 'QUESTION_FORM_ID'});
					this.adapter.model.belongsTo(this.adapter.model, {
						foreignKey: 'QUESTION_PARENT_ID',
						targetKey: 'id'
					});
				} catch (e) {
				}
				return await this.adapter.model.findAll({
					include: [this.adapter.model, {model: PredefinedQuestionAnswer}],
					attributes: ['id', 'LABEL', 'TYPE', 'EVALUATION_FORM_ID']
				})
			}
		},
		loadQuestions: {
			async handler(ctx) {
				let PredefinedQuestionAnswer = await this.broker.call('predefinedQuestionAnswers.model')
				try {
					this.adapter.model.hasMany(PredefinedQuestionAnswer, {foreignKey: 'QUESTION_FORM_ID'});
				} catch (e) {
				}
				return await this.adapter.model.findAll({
					where: {EVALUATION_FORM_ID: ctx.params.form},
					include: [{model: PredefinedQuestionAnswer}],
				})
			}
		},
		deleteQuestion: {
			async handler(ctx) {
				let PredefinedQuestionAnswer = await this.broker.call('predefinedQuestionAnswers.model')
				await PredefinedQuestionAnswer.destroy({where: {QUESTION_FORM_ID: ctx.params.id}})
				return await this.adapter.model.destroy({where: {id: ctx.params.id}})
			}
		},
		newQuestion: {
			async handler(ctx) {

				let PredefinedQuestionAnswer = await this.broker.call('predefinedQuestionAnswers.model')

				let question = await this.adapter.model.create(ctx.params)
				question = JSON.parse(JSON.stringify(question))
				ctx.params.answers?.map(elt => {
					PredefinedQuestionAnswer.create({
						QUESTION_FORM_ID: question.id,
						LABEL: elt.LABEL,
						MARK: elt.MARK,
					})
				})
				return question;
			}
		},
		submit: {
			async handler(ctx) {
				let StudentAnswers = await this.broker.call('studentAnswers.model')
				let StudentEvaluationSessions = await this.broker.call('studentEvaluationSessions.model')

				await StudentEvaluationSessions.update({
					STATUS: 'CLOSED'
				}, {
					where: {
						id: ctx.params.STUDENT_EVALUATION_SESSION,
						EVALUATION_SESSION_ID: ctx.params.EVALUATION_SESSION_ID
					}
				})

				for (const i of ctx.params.input) {
					await StudentAnswers.destroy({
						where: {
							STUDENT_EVALUATION_SESSION_ID: ctx.params.STUDENT_EVALUATION_SESSION,
							QUESTION_FORM_ID: i.id,
						}
					});
				}
				let f = await StudentAnswers.bulkCreate(ctx.params.input.map(i => {
					return {
						STUDENT_EVALUATION_SESSION_ID: ctx.params.STUDENT_EVALUATION_SESSION,
						QUESTION_FORM_ID: i.id,
						CHOSEN_ANSWER_ID: i.value.toString()
					}
				}));
				if (f)
					ctx.meta.$statusCode = 201;
				return f;
			}
		},
		model: {
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
	}
	,

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {
	}
}
;
