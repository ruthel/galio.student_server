"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const Application = require("../../models/course/Application");
const {closeCoursesChoices} = require("../../helpers/mail");

module.exports = {
	name: "applications",
	mixins: [DbService],
	adapter,
	model: Application,

	actions: {
		gets: {
			params: {
				employee: {type: 'string'}
			},
			async handler(ctx) {
				try {

					let ApplicationChoice = await this.broker.call('applicationChoices.model')
					let Subject = await this.broker.call('subjects.model')
					let SessionApplication = await this.broker.call('sessionApplications.model')

					try {
						this.adapter.model.hasMany(ApplicationChoice, {foreignKey: 'APPLICATION_ID'});
						this.adapter.model.belongsTo(SessionApplication, {
							foreignKey: 'SESSION_APPLICATION_ID',
							targetKey: 'id'
						});
						ApplicationChoice.belongsTo(Subject, {foreignKey: 'SUBJECT_ID', targetKey: 'SUBJECT_ID'});
					} catch (e) {

					}

					let result = await this.adapter.model.findAll({
						where: {
							EMPLOYEE_ID: ctx.params.employee,
						},
						include: [{
							model: ApplicationChoice,
							where: {
								AFFECTATION: 1
							},
							include: Subject
						}, {
							model: SessionApplication,
						}],
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
		getAll: {
			params: {
				employee: {type: 'string'}
			},
			async handler(ctx) {
				try {

					let ApplicationChoice = await this.broker.call('applicationChoices.model')
					let Subject = await this.broker.call('subjects.model')
					let SessionApplication = await this.broker.call('sessionApplications.model')

					try {
						this.adapter.model.hasMany(ApplicationChoice, {
							foreignKey: 'APPLICATION_ID',
							targetKey: 'id',
							as: 'ApplicationChoices'
						});
						this.adapter.model.belongsTo(SessionApplication, {
							foreignKey: 'SESSION_APPLICATION_ID',
							targetKey: 'id',
							as: 'SessionApplication'
						});
						ApplicationChoice.belongsTo(Subject, {
							foreignKey: 'SUBJECT_ID',
							targetKey: 'SUBJECT_ID',
							as: 'Subject'
						});
					} catch (e) {

					}

					let result = await this.adapter.model.findAll({
						where: {
							EMPLOYEE_ID: ctx.params.employee,
							// CLOSED: true,
						},
						include: [{
							model: ApplicationChoice,
							as: 'ApplicationChoices',
							include: [{
								model: Subject,
								as: 'Subject'
							}]
						}, {
							model: SessionApplication,
							as: 'SessionApplication'
						}],
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
		close: {
			params: {
				id: {type: 'string'}
			},
			async handler(ctx) {
				try {

					let Employee = await this.broker.call('employees.model')
					let SessionApplication = await this.broker.call('sessionApplications.model')

					try {
						this.adapter.model.belongsTo(SessionApplication, {
							foreignKey: 'SESSION_APPLICATION_ID',
							targetKey: 'id'
						});
					} catch (e) {

					}

					let existSes = await SessionApplication.findOne({where: {ACTIVED: true}})
					if (existSes) {
						let result = await this.adapter.model.update({CLOSED: true}, {
								where: {
									id: ctx.params.id,
								},
								returning: true
							}
						)

						result = JSON.parse(JSON.stringify(result))
						existSes = JSON.parse(JSON.stringify(existSes))

						let emp = await Employee.findOne({where: {MATRICULE: result[1][0].EMPLOYEE_ID}});
						emp = JSON.parse(JSON.stringify(emp))

						await closeCoursesChoices(result[1][0], existSes, emp)
						if (result)
							return result
						else {
							ctx.meta.$statusCode = 400;
							return {message: 'Bad request'}
						}
					}
				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
				}
			}
		},
		current: {
			params: {
				employee: {type: 'string'},
				session_application_id: {type: 'string'}
			},
			async handler(ctx) {
				try {

					let SubjectConstraint = await this.broker.call('subjectConstraints.model')

					if (ctx.params.employee) {

						try {
							this.adapter.model.belongsTo(SubjectConstraint, {
								foreignKey: 'SUBJECT_CONSTRAINT_ID',
								targetKey: 'id',
								as: 'SubjectConstraint',
							})
						} catch (e) {

						}
						let result = await this.adapter.model.findOne({
							where: {
								// CLOSED: false,
								EMPLOYEE_ID: ctx.params.employee,
								SESSION_APPLICATION_ID: ctx.params.session_application_id
							},
							include: [
								{
									model: SubjectConstraint,
									as: 'SubjectConstraint',
								}
							],
						})

						if (result)
							return result
						else {
							ctx.meta.$statusCode = 400;
							return {message: 'Bad request'}
						}
					}
				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
				}
			}
		},
		getForSessionAffectionList: {
			params: {
				id: {type: 'string'},
			},
			async handler(ctx) {
				try {

					let Employee = await this.broker.call('employees.model')
					let ApplicationChoice = await this.broker.call('applicationChoices.model')
					let Subject = await this.broker.call('subjects.model')

					try {
						this.adapter.model.belongsTo(Employee, {
							foreignKey: 'EMPLOYEE_ID',
							targetKey: 'MATRICULE',
							as: 'Employee',
						});
					} catch (e) {
					}

					try {
						this.adapter.model.hasMany(ApplicationChoice, {
							foreignKey: 'APPLICATION_ID',
							targetKey: 'id',
							as: 'ApplicationChoices'
						});
					} catch (e) {
					}

					try {
						ApplicationChoice.hasOne(this.adapter.model, {foreignKey: 'id', targetKey: 'APPLICATION_ID'});
					} catch (e) {
					}
					try {
						ApplicationChoice.belongsTo(Subject, {
							foreignKey: 'SUBJECT_ID',
							targetKey: 'SUBJECT_ID',
							as: 'Subject',
						});
					} catch (e) {
					}


					let result = await this.adapter.model.findAll({
						where: {
							SESSION_APPLICATION_ID: ctx.params.id,
						},
						attributes: [
							"id",
							"EMPLOYEE_ID",
							"TOTAL_HOURS",
							"CLOSED",
							"createdAt",
							"updatedAt",
						],
						include: [
							{
								model: ApplicationChoice,
								attributes: [
									"SUBJECT_ID",
									"APPLICATION_ID",
									"AFFECTATION",
									"CATEGORY",
									"CLOSURE",
								],
								as: 'ApplicationChoices',
								include: [{
									model: Subject,
									as: 'Subject',
									attributes: [
										"CLASS_ID",
										"SUBJECT_ID",
										"SUBJECT_NAME",
										"SUBJECT_VH_CM_INITIAL",
										"SUBJECT_VH_TD_INITIAL",
										"SUBJECT_VH_TP_INITIAL",
									]
								}]
							},
							{
								model: Employee,
								as: 'Employee',
								attributes: ['MATRICULE', 'FIRSTNAME', 'LASTNAME', 'id']
							}
						],
					})

					result = JSON.parse(JSON.stringify(result))

					if (result)
						return result.filter(elt => elt.ApplicationChoices.filter(ac => ac.AFFECTATION === 1).length > 0)
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
		getForSession: {
			params: {
				id: {type: 'string'},
			},
			async handler(ctx) {
				try {

					let Employee = await this.broker.call('employees.model')
					try {
						this.adapter.model.belongsTo(Employee, {
							foreignKey: 'EMPLOYEE_ID',
							targetKey: 'MATRICULE',
							as: 'Employee'
						});
					} catch (e) {
					}

					let result = await this.adapter.model.findAll({
						where: {
							SESSION_APPLICATION_ID: ctx.params.id,
						},
						include: [
							// {
							//   model: ApplicationChoice,
							//   include: Subject
							// },
							{
								model: Employee,
								as: 'Employee'
							}],
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
		init: {
			async handler(ctx) {
				try {

					let SubjectConstraint = await this.broker.call('subjectConstraints.model')
					let SessionApplication = await this.broker.call('sessionApplications.model')

					try {
						this.adapter.model.belongsTo(SubjectConstraint, {
							foreignKey: 'SUBJECT_CONSTRAINT_ID',
							targetKey: 'id',
						})
					} catch (e) {

					}

					let subjectConstraint = await SubjectConstraint.findByPk(ctx.params.SUBJECT_CONSTRAINT_ID)
					subjectConstraint = JSON.parse(JSON.stringify(subjectConstraint))

					let current = await this.adapter.model.findOne({
						where: {
							CLOSED: true,
							EMPLOYEE_ID: ctx.params.EMPLOYEE_ID,
							SESSION_APPLICATION_ID: ctx.params.SESSION_APPLICATION_ID
						}
					})

					current = JSON.parse(JSON.stringify(current))

					if (current)
						return {...current, SubjectConstraint: subjectConstraint}


					let currentSes = await SessionApplication.findOne({
						where: {
							ACTIVED: true,
							id: ctx.params.SESSION_APPLICATION_ID
						}
					})

					currentSes = JSON.parse(JSON.stringify(currentSes))


					if (currentSes) {
						let alreadyClosed = await this.adapter.model.findOne({
							where: {
								CLOSED: true,
								SESSION_APPLICATION_ID: currentSes.id,
								EMPLOYEE_ID: ctx.params.EMPLOYEE_ID
							},
						})
						alreadyClosed = JSON.parse(JSON.stringify(alreadyClosed))

						if (alreadyClosed) {
							ctx.meta.$statusCode = 403;
							return {message: 'Already closed'}
						} else {
							let application = await this.adapter.model.create(ctx.params)
							if (application) {
								application = JSON.parse(JSON.stringify(application))
								ctx.meta.$statusCode = 201;
								return {...application, SubjectConstraint: subjectConstraint}
							} else {
								ctx.meta.$statusCode = 400;
								return {message: 'Bad request'}
							}
						}
					} else {
						return res.status(403).json({message: 'Implossible to create application whithout opened session'})
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
		},
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
