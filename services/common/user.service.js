"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const User = require("../../models/common/User");
const {encrypt, decrypt} = require('../../helpers/cryptogram')
const bcrypt = require('bcryptjs')

module.exports = {
	name: "users",

	mixins: [DbService],
	adapter,
	model: User,

	actions: {
		delete: {
			params: {
				elt: {type: 'string'}
			},
			async handler(ctx) {
				try {
					const result = await this.adapter.model.destroy({USERNAME: ctx.params.elt});
					if (!result)
						ctx.meta.$statusCode = 400;
					return result

				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
				}
			}
		},
		gets: {
			async handler(ctx) {
				try {

					let RequestGroup = await this.broker.call('requestGroups.model')
					let OrganizationGroup = await this.broker.call('organizationGroups.model')

					try {
						await this.adapter.model.belongsTo(RequestGroup, {
							foreignKey: 'REQUEST_GROUP_ID',
							targetKey: 'REQUEST_GROUP_ID',
							as: 'RequestGroup',
						});

						await this.adapter.model.belongsTo(OrganizationGroup, {
							foreignKey: 'ORGANIZATION_GROUP',
							targetKey: 'id',
							as: 'OrganizationGroup',
						});

					} catch (e) {
					}

					let result = await this.adapter.model.findAll({
						include: [{model: RequestGroup, as: 'RequestGroup'}, {model: OrganizationGroup, as: 'OrganizationGroup'}],
					})
					result = JSON.parse(JSON.stringify(result))

					if (result) {
						result = result.map(user => {
							let cpUser = user

							delete cpUser.USERPRIVILEGE
							delete cpUser.PASSWORD
							delete cpUser.TOKEN
							delete cpUser.createdAt
							delete cpUser.updatedAt

							return cpUser
						})
						return result
					} else
						ctx.meta.$statusCode = 204;
				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
				}
			}
		},
		getUser: {
			params: {
				id: {type: 'string'}
			},
			async handler(ctx) {
				try {
					if (ctx.params.id) {
						let RequestGroup = await this.broker.call('requestGroups.model')

						try {
							this.adapter.model.belongsTo(RequestGroup, {
								foreignKey: 'REQUEST_GROUP_ID',
								targetKey: 'REQUEST_GROUP_ID'
							});
						} catch (e) {
						}
						let result = await this.adapter.model.findOne({
							include: [{model: RequestGroup}],
							where: {id: ctx.params.id}
						});
						result = JSON.parse(JSON.stringify(result))
						if (result) {
							return {
								...result,
								USERPRIVILEGE: decrypt({
									iv: result.USERPRIVILEGE.split('@')[0],
									content: result.USERPRIVILEGE.split('@')[1]
								})
							}
						} else
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
		update: {
			async handler(ctx) {
				try {
					let data = ctx.params
					let exist = await this.adapter.model.count({where: {USERNAME: data.username}}) > 0
					if (exist) {

						const hash = encrypt(data.privilege.join('-'));
						let dataUser = {}
						dataUser.USERNAME = data.username;
						dataUser.USERPROFILE = data.profile;
						if (data.pwd)
							dataUser.PASSWORD = bcrypt.hashSync(data.pwd, 10);
						dataUser.REQUEST_GROUP_ID = data.group;
						dataUser.ORGANIZATION_GROUP = data.orgaGroup;
						dataUser.USERPRIVILEGE = hash.iv + '@' + hash.content;

						let result = await this.adapter.model.update(dataUser, {
							where: {
								id: data.id
							}
						});

						if (result) {
							return result
						} else
							ctx.meta.$statusCode = 403;
					} else {
						ctx.meta.$statusCode = 400;
						return {message: "user doesn't exists"}
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

					let data = ctx.params
					let exist = await this.adapter.model.count({where: {USERNAME: data.username}}) > 0

					if (!exist) {

						const hash = encrypt(data.privilege.join('-'));
						let result = await this.adapter.model.create({
							USERNAME: data.username,
							PASSWORD: bcrypt.hashSync(data.pwd, 10),
							USERPRIVILEGE: hash.iv + '@' + hash.content,
							USERPROFILE: data.profile,
							REQUEST_GROUP_ID: data.group,
							ORGANIZATION_GROUP: data.orgaGroup,
							ACTIVATED: 1
						})

						if (result) {
							ctx.meta.$statusCode = 201;
							return result
						} else {
							ctx.meta.$statusCode = 400;
							return {message: 'Bad request'}
						}
					} else {
						ctx.meta.$statusCode = 409;
						return {message: "user already exists"}
					}
				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
				}
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
