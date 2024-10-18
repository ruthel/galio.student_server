"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const Request = require("../../models/request/Request");
const {Sequelize, Op} = require("sequelize");
const {encode, decode} = require('url-encode-decode')

const _ = require("lodash");
const fs = require("fs");
const {callbackFolder} = require("../../helpers/func");
const {Logger} = require("sequelize/lib/utils/logger");

module.exports = {
	name: "requests",

	mixins: [DbService],
	adapter,
	model: Request,

	actions: {
		getRequest: {
			async handler(ctx) {
				try {
					let RequestCategory = await this.broker.call('requestsCategories.model')
					let Employee = await this.broker.call('employees.model')

					try {
						this.adapter.model.belongsTo(RequestCategory, {
							foreignKey: "REQUEST_CATEGORY_ID",
							targetKey: 'ID_SCAT',
							as: 'RequestCategory'
						});
					} catch (e) {
					}
					try {
						this.adapter.model.belongsTo(Employee, {
							foreignKey: "REQUEST_AUTHOR",
							targetKey: 'MATRICULE',
							as: 'Employee',
						});
					} catch (e) {
					}

					let result = await this.adapter.model.findAll({
						include: [
							{
								model: RequestCategory,
								as: 'RequestCategory',
								attributes: ["S_CATEGORIE", "ID_SCAT", "ID_CAT"]
							},
							{
								model: Employee,
								as: 'Employee',
								attributes: ["LASTNAME", "FIRSTNAME", "MATRICULE"]
							}
						]
					})

					if (result)
						return result
					else
						ctx.meta.$statusCode = 204;
				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
				}

			},
			model: {
				async handler(ctx) {
					return this.model
				}
			}
		},
		getRequestConcerned: {
			params: {
				user: {type: 'string'}
			},
			async handler(ctx) {
				try {

					let RequestCategory = await this.broker.call('requestsCategories.model')
					let Employee = await this.broker.call('employees.model')
					let RequestStepBatch = await this.broker.call('requestStepBatches.model')
					let RequestBatch = await this.broker.call('requestBatches.model')

					try {
						this.adapter.model.belongsTo(RequestCategory, {
							foreignKey: 'REQUEST_CATEGORY_ID',
							targetKey: 'ID_SCAT',
							as: 'RequestCategory'
						})
					} catch (e) {
					}
					try {
						this.adapter.model.belongsTo(Employee, {
							foreignKey: 'REQUEST_AUTHOR',
							targetKey: 'MATRICULE',
							as: 'Employee'
						})
					} catch (e) {
					}
					try {
						this.adapter.model.belongsTo(RequestStepBatch, {
							foreignKey: 'REQUEST_ID',
							targetKey: 'REQUEST_ID',
							as: 'RequestStepBatch'
						})
					} catch (e) {
					}
					try {
						RequestStepBatch.belongsTo(RequestBatch, {
							foreignKey: 'RBATCH_ID',
							targetKey: 'RBATCH_NUMBER',
							as: 'RequestBatch'
						})
					} catch (e) {
					}
					let result;
					if (ctx.params.user === 'ADM')
						result = await this.adapter.model.findAll({
							include: [{model: RequestCategory, as: 'RequestCategory'}, {model: Employee, as: 'Employee'}],
						});
					else if (ctx.params.user === 'SENG')
						result = await this.adapter.model.findAll({
							include: [{model: RequestCategory, as: 'RequestCategory'}, {model: Employee, as: 'Employee'}],
							where: {
								REQUEST_UNITY_ID: {
									[Op.like]: ctx.params.user === 'ADM' ? '%%' : ctx.params.user,
									[Op.not]: 'EMPLOYEE'
								},
								REQUEST_STATUS: {[Op.not]: 'REJECTED'}
							}
						});
					else {
						result = await this.adapter.model.findAll({
							include: [
								{model: RequestCategory, as: 'RequestCategory'},
								{model: Employee, as: 'Employee'},
								{
									required: false,
									model: RequestStepBatch,
									as: 'RequestStepBatch',
									where: {
										REQUEST_DEST_ID: ctx.params.user,
									},
									include: [
										{
											model: RequestBatch,
											as: 'RequestBatch',
											where: {
												RBATCH_UNREAD: 0,
											}
										}
									],
								}
							],
							where: {
								REQUEST_UNITY_ID: {[Op.like]: ctx.params.user === 'ADM' ? '%%' : ctx.params.user},
							}
						});

						result = JSON.parse(JSON.stringify(result))
						result = result?.filter(elt => !!elt.RequestStepBatch || (!elt.RequestStepBatch && elt.RequestCategory.ID_SCAT === '0601'))
						result = _.uniqBy(result || [], 'id')
					}

					this.logger.debug("Request received: " + ctx);

					if (result)
						return result
					else
						ctx.meta.$statusCode = 204;

				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
				}

			},
			model: {
				async handler(ctx) {
					return this.model
				}
			}
		},
		getRequestConcernedAuthor: {
			params: {
				matricule: {type: 'string'}
			},
			async handler(ctx) {
				try {
					if (ctx.params.matricule) {
						let RequestCategory = await this.broker.call('requestsCategories.model')
						let RequestStep = await this.broker.call('requestsSteps.model')

						try {
							this.adapter.model.belongsTo(RequestCategory, {
								foreignKey: "REQUEST_CATEGORY_ID",
								targetKey: 'ID_SCAT',
								as: 'RequestCategory'
							});
						} catch (e) {
						}
						try {
							this.adapter.model.belongsTo(RequestStep, {
								foreignKey: "REQUEST_ID",
								targetKey: 'REQUEST_ID',
								as: 'RequestStep'
							});
						} catch (e) {
						}

						let result = await this.adapter.model.findAll({
							where: {REQUEST_AUTHOR: ctx.params.matricule},
							include: [{
								model: RequestCategory,
								as: 'RequestCategory',
								attributes: ["S_CATEGORIE", "ID_SCAT", "ID_CAT"]
							}, {
								model: RequestStep,
								as: 'RequestStep',
								attributes: ["RSTEP_COMM", "RSTEP_STATUS"]
							}]
						})

						let rSteps = JSON.parse(JSON.stringify(result))
						result = _.uniqBy([...rSteps], 'REQUEST_ID')

						result = result.map((elt, i, arr) => {
							let closedStep = rSteps.find(e => e.REQUEST_ID === elt.REQUEST_ID && !!e.RequestStep && (e.RequestStep?.RSTEP_STATUS === "VALIDATED" || e.RequestStep?.RSTEP_STATUS === "REJECTED"))?.RequestStep
							let processingStep = arr.find(e => e.REQUEST_ID === elt.REQUEST_ID && e.RequestStep && e.RequestStep?.RSTEP_STATUS === "PROCESSING")?.RequestStep

							return {...elt, RequestStep: closedStep ? closedStep : processingStep}
						})

						if (result)
							return result
						else
							ctx.meta.$statusCode = 204;
					} else {
						ctx.meta.$statusCode = 400;
						return {message: "missing or incorrect parameters"}
					}

				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
				}

			}
		},
		getById: {
			params: {
				REQUEST_ID: {type: 'string'}
			},
			async handler(ctx) {
				try {
					if (ctx.params.REQUEST_ID) {
						let RequestCategory = await this.broker.call('requestsCategories.model')
						let RequestStep = await this.broker.call('requestsSteps.model')
						let Class = await this.broker.call('classes.model')

						try {
							this.adapter.model.belongsTo(RequestCategory, {
								foreignKey: "REQUEST_CATEGORY_ID",
								targetKey: 'ID_SCAT',
								as: 'RequestCategory'
							});
						} catch (e) {
						}
						try {
							this.adapter.model.belongsTo(RequestStep, {
								foreignKey: "REQUEST_ID",
								targetKey: 'REQUEST_ID',
								as: 'RequestStep'
							});
						} catch (e) {
						}
						try {
							this.adapter.model.belongsTo(Class, {
								foreignKey: "CLASS_ID",
								targetKey: 'CLASS_ID',
								as: 'Class'
							});
						} catch (e) {
						}

						let result = await this.adapter.model.findAll({
							where: {REQUEST_ID: ctx.params.REQUEST_ID},
							include: [{
								model: RequestCategory,
								as: 'RequestCategory',
								attributes: ["S_CATEGORIE", "ID_SCAT", "ID_CAT"]
							}, {
								model: RequestStep,
								as: 'RequestStep',
								attributes: ["RSTEP_COMM", "RSTEP_STATUS"]
							}, {
								model: Class,
								as: 'Class',
								attributes: ["BRANCH_ID", "BRANCH_NAME"]
							}]
						})


						let rSteps = JSON.parse(JSON.stringify(result))
						result = _.uniqBy([...rSteps], 'REQUEST_ID')
						result = result.map((elt, i, arr) => {
							let closedStep = rSteps.find(e => e.REQUEST_ID === elt.REQUEST_ID && !!e.RequestStep && (e.RequestStep?.RSTEP_STATUS === "VALIDATED" || e.RequestStep?.RSTEP_STATUS === "REJECTED"))?.RequestStep
							let processingStep = arr.find(e => e.REQUEST_ID === elt.REQUEST_ID && e.RequestStep && e.RequestStep?.RSTEP_STATUS === "PROCESSING")?.RequestStep

							return {...elt, RequestStep: closedStep ? closedStep : processingStep}
						})

						if (result)
							return result[0]
						else
							ctx.meta.$statusCode = 204;
					} else {
						ctx.meta.$statusCode = 400;
						return {message: "missing or incorrect parameters"}
					}

				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
				}

			}
		},
		getStatRequestForUser: {
			params: {
				matricule: {type: 'string'}
			},
			async handler(ctx) {
				try {

					if (ctx.params.matricule) {

						let totalDone = await this.adapter.model.count({where: {REQUEST_AUTHOR: ctx.params.matricule}})
						let totalClose = await this.adapter.model.count({
							where: {
								REQUEST_AUTHOR: ctx.params.matricule,
								REQUEST_STATUS: 'CLOSED'
							}
						})
						let totalProcessing = await this.adapter.model.count({
							where: {
								REQUEST_AUTHOR: ctx.params.matricule,
								REQUEST_STATUS: 'PROCESSING'
							}
						})
						let totalRejected = await this.adapter.model.count({
							where: {
								REQUEST_AUTHOR: ctx.params.matricule,
								REQUEST_STATUS: 'REJECTED'
							}
						})
						let totalRegistered = await this.adapter.model.count({
							where: {
								REQUEST_AUTHOR: ctx.params.matricule,
								REQUEST_STATUS: 'REGISTERED'
							}
						})
						let totalValidated = await this.adapter.model.count({
							where: {
								REQUEST_AUTHOR: ctx.params.matricule,
								REQUEST_STATUS: 'VALIDATED'
							}
						})

						let result = {
							totalDone,
							totalClose,
							totalProcessing,
							totalRejected,
							totalRegistered,
							totalValidated
						}

						if (result)
							return result
						else
							ctx.meta.$statusCode = 204;
					} else {
						ctx.meta.$statusCode = 400;
						return {message: "missing or incorrect parameters"}
					}

				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
				}

			}
		},
		setPrinted: {
			async handler(ctx) {
				try {

					if (ctx.params.id) {
						let result = await this.adapter.model.update({PRINTED: true}, {where: {id: ctx.params.id}})
						if (result)
							return result
						else {
							ctx.meta.$statusCode = 400;
							return {message: 'An error occurred when set printing'}
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
		rejectRequest: {
			async handler(ctx) {
				try {

					if (ctx.params.id) {
						let result = await this.adapter.model.update({REQUEST_STATUS: "REJECTED"}, {where: {id: ctx.params.id}})
						if (result)
							return result
						else {
							ctx.meta.$statusCode = 400;
							return {message: 'An error occurred when set printing'}
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
		createRequest: {
			async handler(ctx) {
				try {

					let request = ctx.params
					if (!!request.REQUEST_FILE) {
						let base64Parts1 = request.REQUEST_FILE.split(';base64,')
						let base641 = base64Parts1.pop();
						fs.mkdir(`upload/${request.REQUEST_AUTHOR}`, callbackFolder)
						let path1 = `upload/${request.REQUEST_AUTHOR}/${Date.now()}.pdf`
						fs.writeFile(path1, base641, 'base64', callbackFolder);
						request.REQUEST_FILE = `${process.env.server_root}${path1}`
					}

					let pblmDate = new Date(request.REQUEST_PBLM_DATE)
					let pblmDateString = pblmDate.toISOString()
					let result = this.adapter.db.query(`[dbo].[INSERTION_REQUEST]
            @REQUEST_ID="${request.REQUEST_ID || 'NULL'}",
            @REQUEST_CATEGORY_ID="${request.REQUEST_CATEGORY_ID}",
            @CLASS_ID="${request.CLASS_ID || ' '}",
            @SUBJECT_ID="${request.SUBJECT_ID || ' '}",
            @REPRO_COPY_NUMBER=${request.REPRO_COPY_NUMBER || 0},
            @REPRO_STUDENT_COUNT=${request.REPRO_STUDENT_COUNT || 0},
            @REQUEST_FILE="${request.REQUEST_FILE || ' '}",
            @REQUEST_PBLM_DATE='${pblmDateString.split("T")[0]}',
            @REQUEST_PBLM_WEEK="${request.REQUEST_PBLM_WEEK || ' '}",
            @REQUEST_AUTHOR="${request.REQUEST_AUTHOR || ' '}",
            @CONTRACT_NUMBER="${request.CONTRACT_NUMBER || ' '}",
            @TH_DISPLAYED=${request.TH_DISPLAYED || 'NULL'},
            @TH_EXPECTED=${request.TH_EXPECTED || 'NULL'},
            @VH_DISPLAYED=${request.VH_DISPLAYED || 'NULL'},
            @VH_EXPECTED=${request.VH_EXPECTED || 'NULL'},
            @TI_DISPLAYED=${request.TI_DISPLAYED || 'NULL'},
            @TI_EXPECTED=${request.TI_EXPECTED || 'NULL'},
            @AMOUNT_RECEIVED=${request.AMOUNT_RECEIVED || 'NULL'},
            @AMOUNT_EXPECTED=${request.AMOUNT_EXPECTED || 'NULL'},
            @REQUEST_PBLM_HOUR_END= ${request.REQUEST_PBLM_HOUR_END ? '"' + request.REQUEST_PBLM_HOUR_END + '"' : 'NULL'},
            @REQUEST_PBLM_HOUR_START= ${request.REQUEST_PBLM_HOUR_START ? '"' + request.REQUEST_PBLM_HOUR_START + '"' : 'NULL'},
            @REQUEST_OBJECT="${request.REQUEST_OBJECT || "N/A"}",
            @DESCRIPTION='${encode(request.DESCRIPTION || "") || " "}',
            @REQUEST_UNITY_ID="${request.REQUEST_UNITY_ID || request.REQUEST_CATEGORY_ID === '0601' ? request.BRANCH_ABREVIATION : 'SENG'}",
            @REQUEST_STATUS="${request.REQUEST_STATUS || 'REGISTERED'}",
            @createdAt='${(new Date().toISOString()).split('T')[0]}',
            @updatedat='${(new Date().toISOString()).split('T')[0]}'
        `)

					if (result) {
						ctx.meta.$statusCode = 201;
						return result
					} else {
						ctx.meta.$statusCode = 400;
						return {message: "missing or incorrect parameters"}
					}

				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
				}

			}
		},
		getReport: {
			async handler(ctx) {
				try {

					let {sender, receiver, category, startDate, endDate, labelDecision, regime} = ctx.params
					let result = await this.adapter.db.query(`
            SELECT DISTINCT rs.REQUEST_ID, rs.RSTEPCONFIG_ID, r.REQUEST_CATEGORY_ID,r.CLASS_ID, rs.createdAt, rs.RSTEP_STATUS
             FROM REQUEST_STEPS rs JOIN REQUESTS r ON r.REQUEST_ID = rs.REQUEST_ID
             WHERE rs.RSTEPCONFIG_ID LIKE '${sender}%${receiver}'
                AND r.REQUEST_ID LIKE '%${category}@%'
                AND rs.createdAt BETWEEN '${startDate}' AND '${endDate}'
                AND rs.RSTEP_STATUS LIKE '%${labelDecision}%'
                AND r.CLASS_ID LIKE '%/${regime}%'
             `)
					console.log(result)
					if (result) {
						ctx.meta.$statusCode = 201;
						return result
					} else {
						ctx.meta.$statusCode = 400;
						return {message: "missing or incorrect parameters"}
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
	}
	,

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {
	}
}
;
