"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const Document = require("../../models/common/Document");
const axios = require('axios');
const fs = require("fs");

module.exports = {
	name: "documents",

	mixins: [DbService],
	adapter,
	model: Document,

	actions: {
		gets: {
			async handler(ctx) {
				try {

					let result = await this.adapter.model.findAll({attributes: ['FILE', 'EMPLOYEE']})
					if (result)
						return result
					else {
						ctx.meta.$statusCode = 204;
						return []
					}

				} catch (e) {
					ctx.meta.$statusCode = 403;
					return e.response.data
				}
			}
		},
		getByEmployee: {
			params: {
				employee: {type: 'string'}
			},
			async handler(ctx) {
				try {

					let result = await this.adapter.model.findAll({
						where: {EMPLOYEE: ctx.params.employee},
						// attributes: ['FILE', 'EMPLOYEE']
					})

					if (result)
						return result
					else {
						ctx.meta.$statusCode = 204;
						return []
					}

				} catch (e) {
					ctx.meta.$statusCode = 403;
					return e.response.data
				}
			}
		},
		delete: {
			async handler(ctx) {
				try {
					let data = ctx.params
					if (data.FILE) {
						try {
							fs.unlinkSync(`upload/${data.FILE.split('upload/')[1]}`)
						} catch (e) {
							console.log(e)
						}
					}

					let result = this.adapter.model.destroy({where: {EMPLOYEE: data.EMPLOYEE, DESIGNATION: data.DESIGNATION}});

					if (result)
						return result
					else
						ctx.meta.$statusCode = 204;

				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
				}
			}
		},
		create: {
			async handler(ctx) {
				try {

					let Employee = await this.broker.call('employees.model')
					let data = ctx.params
					let exists = await this.adapter.model.findOne({
						where: {
							EMPLOYEE: data.EMPLOYEE,
							DESIGNATION: data.DESIGNATION,
							SPECIALITY: data.SPECIALITY || ""
						}
					});

					if (!exists) {
						let base64Parts = data.FILE.split(';base64,')
						let ext = base64Parts[0].split('/').pop()
						let base64Data = base64Parts.pop();

						fs.mkdir(`upload/${data.EMPLOYEE}`, () => {
						})
						fs.writeFile(`upload/${data.EMPLOYEE}/${data.DESIGNATION}${data.SPECIALITY ? '-' + data.SPECIALITY : ""}.${ext}`, base64Data, 'base64', () => {
						});

						data.FILE = `${process.env.server_root}upload/${data.EMPLOYEE}/${data.DESIGNATION}${data.SPECIALITY ? '-' + data.SPECIALITY : ""}.${ext}`

						let document = await this.adapter.model.create(data);
						let employee = await Employee.findOne({MATRICULE: document.EMPLOYEE});

						// let lastDip = await this.adapter.model.findOne({id: employee.LASTDIPLOMA})
						//
						// if (document.LEVEL > lastDip.LEVEL)
						// 	await Employee.update({LASTDIPLOMA: document.id}, {where: {MATRICULE: document.EMPLOYEE}});

						if (document) {
							ctx.meta.$statusCode = 201;
							return document
						} else {
							ctx.meta.$statusCode = 400;
							return {message: "exists"}
						}
					} else {
						ctx.meta.$statusCode = 409;
						return {message: 'document already exist'}
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
