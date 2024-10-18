"use strict";

const adapter = require("../../adapter/mssql");
const {codeEmail, welcomeEmail} = require("../../helpers/mail");
const bcrypt = require('bcryptjs');

const jwt = require("jsonwebtoken");
const {decrypt} = require("../../helpers/cryptogram");

module.exports = {
	name: "authenticators",
	adapter,

	actions: {
		loginStepForSendCode: {
			async handler(ctx) {

				let min = 110010, max = 987689

				try {
					let Employee = await this.employee()
					let result = await Employee.findOne({
						where: {
							EMAIL: ctx.params.email,
							STUDENT_ID: ctx.params.matricule,
							// EMAIL_VERIFIED: true,
						},
						attributes: ['id', 'STUDENT_ID', 'EMAIL']
					})

					result = JSON.parse(JSON.stringify(result))

					if (!result) {
						ctx.meta.$statusCode = 201;
						return
					}


					const SIGN_CODE = Math.floor(Math.random() * (max - min + 1) + min);
					let response = await Employee.update({SIGN_CODE}, {
						where: {id: result.id}
					})

					await codeEmail(result, SIGN_CODE)

					if (response[0] > 0)
						return {}
					else
						ctx.meta.$statusCode = 204;

				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
				}
			}
		},
		signUp: {
			async handler(ctx) {
				try {

					let Employee = await this.employee()
					let exists = await Employee.findOne({
						where: {
							STUDENT_ID: ctx.params.matricule,
							BIRTHDATE: ctx.params.birthdate,
							EMAIL_VERIFIED: true
						}
					})

					if (exists) {
						ctx.meta.$statusCode = 409;
						return {}
					} else {
						let result = await Employee.findOne({
							where: {
								STUDENT_ID: ctx.params.matricule,
								EMAIL_VERIFIED: false,
							}
						})

						result = JSON.parse(JSON.stringify(result))

						if (result) {
							ctx.meta.$statusCode = 201;
							return result
						} else
							ctx.meta.$statusCode = 204;
					}

				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
				}
			}
		},
		verifyEmail: {
			async handler(ctx) {

				try {
					let Employee = await this.employee()
					const {email, matricule} = ctx.params

					const hashedEmail = await bcrypt.hash(email, 8);
					let token = jwt.sign({
						token: hashedEmail
					}, process.env.emailKey, {
						expiresIn: 3600 * 24
					});

					let x = await Employee.update({
						EMAIL_VERIFICATION_TOKEN: token,
						EMAIL: email,
						EMAIL_VERIFIED: false
					}, {where: {STUDENT_ID: matricule}})

					console.log(ctx.params)
					let resultMail = await welcomeEmail({
						...ctx.params,
						emailsSubject: 'Account verification',
						emailText: 'Please verify your email account',
						token,
					});

					if (resultMail)
						if (resultMail) {
							return {}
						} else
							ctx.meta.$statusCode = 403;

				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
				}
			}
		},
		emailConfirmation: {
			async handler(ctx) {

				try {

					let Employee = await this.employee()
					const token = ctx.params.token;
					try {
						jwt.verify(token, process.env.emailKey)
					} catch (e) {
						if (e.name === 'TokenExpiredError') {
							ctx.meta.$statusCode = 401;
							return {message: "session expired", expiredAt: e.expiredAt};
						} else {
							ctx.meta.$statusCode = 400;
							return {message: "invalid token signature !"};
						}
					}

					let emp = await Employee.findOne({where: {EMAIL_VERIFICATION_TOKEN: token}})
					if (!emp)
						throw new Error()

					return await emp.update({
						EMAIL_VERIFICATION_TOKEN: null,
						EMAIL_VERIFIED: true
					});

				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
				}
			}
		},
		codeVerification: {
			async handler(ctx) {

				try {

					let Employee = await this.employee()
					let emp = await Employee.findOne({where: {...ctx.params}})
					emp = JSON.parse(JSON.stringify(emp))

					if (!emp || ((new Date() - new Date(emp.updatedAt)) / 60000) >= 15)
						throw new Error()

					await Employee.update({
						SIGN_CODE: null,
					}, {where: {...ctx.params}})

					let result = await Employee.findOne({
						where: {
							STUDENT_ID: ctx.params.STUDENT_ID,
							// EMAIL_VERIFIED: true,
						}
					})
					result = JSON.parse(JSON.stringify(result))

					let token = jwt.sign({
						EMAIL: result.EMAIL,
						id: result.id
					}, process.env.empKey, {
						expiresIn: 3600 * 2
					});

					let response = await Employee.update({TOKEN: token}, {
						where: {
							id: result.id
						},
						returning: true,
					})

					response = JSON.parse(JSON.stringify(response))
					if (result)
						return response[1][0]
					else
						ctx.meta.$statusCode = 400;

				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
				}
			}
		},
		login: {
			async handler(ctx) {

				try {

					const keys = ['USERNAME', 'PASSWORD']
					const data = ctx.params

					let User = await this.broker.call('users.model')
					let RequestGroup = await this.broker.call('requestGroups.model')
					let OrganizationGroup = await this.broker.call('subjects.model')


					for (const eltKey of keys)
						if (!Object.keys(ctx.params).includes(eltKey)) {
							ctx.meta.$statusCode = 400;
							return {message: "missing or incorrect parameters"}
						}


					User.belongsTo(RequestGroup, {
						foreignKey: 'REQUEST_GROUP_ID',
						targetKey: 'REQUEST_GROUP_ID',
					});

					User.belongsTo(OrganizationGroup, {
						foreignKey: 'ORGANIZATION_GROUP',
						targetKey: 'id',
					});

					let result = await User.findOne({
						include: [RequestGroup, OrganizationGroup],
						where: {
							USERNAME: data.USERNAME,
							ACTIVATED: true
						}
					});

					result = JSON.parse(JSON.stringify(result))


					if (result && bcrypt.compareSync(data.PASSWORD, result.PASSWORD)) {

						let token = jwt.sign({
							PASSWORD: result.PASSWORD,
							id: result.id
						}, process.env.admKey, {
							expiresIn: 3600 * 8
							// expiresIn: 10
						});

						await User.update({TOKEN: token}, {
							where: {
								id: result.id
							},
							returning: true,
						})

						let response = await User.findOne({
							include: [RequestGroup, OrganizationGroup],
							where: {id: result.id}
						})

						if (response && result)
							return {
								...response,
								USERPRIVILEGE: decrypt({
									iv: result.USERPRIVILEGE.split('@')[0],
									content: result.USERPRIVILEGE.split('@')[1]
								})
							}
						else
							ctx.meta.$statusCode = 204;
					} else
						ctx.meta.$statusCode = 204;

				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
				}
			}
		},
		loginStudents: {
			async handler(ctx) {
				try {
					const data = ctx.params

					let Student = await this.broker.call('students.model')
					let result = await Student.findOne({
						where: {
							EMAIL: ctx.params.email,
							STUDENT_ID: ctx.params.matricule
						}
					})

					console.log(ctx.params)

					if (result) {
						result = JSON.parse(JSON.stringify(result))
						let token = jwt.sign({
							STUDENT_ID: result.STUDENT_ID,
							id: result.id
						}, process.env.revKey, {
							expiresIn: 3600 * 8
						});
						result.TOKEN = token
						await Student.update({TOKEN: token}, {
							where: {
								id: result.id
							},
							returning: true,
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
		signInWithFederate: {
			async handler(ctx) {

				try {

					// let AcaYear = await this.broker.call('academicYear.model')
					// // let YEARS = JSON.parse(JSON.stringify(await AcaYear.findAll({
					// // 	where: {ACTIVATED: true},
					// 	attributes: ['id', 'YEAR_ID', 'YEAR_NAME']
					// })))


					let User = await this.broker.call('users.model')
					let RequestGroup = await this.broker.call('requestGroups.model')
					let OrganizationGroup = await this.broker.call('organizationGroups.model')

					try {
						User.belongsTo(RequestGroup, {
							foreignKey: 'REQUEST_GROUP_ID',
							targetKey: 'REQUEST_GROUP_ID',
							as: 'RequestGroup',
						});

						User.belongsTo(OrganizationGroup, {
							foreignKey: 'ORGANIZATION_GROUP',
							targetKey: 'id',
							as: 'OrganizationGroup'
						});
					} catch (e) {
					}

					let result = JSON.parse(JSON.stringify(await User.findOne({
						include: [{model: RequestGroup, as: 'RequestGroup'}, {model: OrganizationGroup, as: 'OrganizationGroup'}],
						where: {
							USERNAME: ctx.params.account.username,
							ACTIVATED: true
						}
					})));

					if (result) {
						if (ctx.params.tenantId === process.env.tenantId) {
							let token = jwt.sign({
								PASSWORD: result.PASSWORD,
								id: result.id
							}, process.env.admKey, {
								expiresIn: 3600 * 8
							});


							let updatedNum = await User.update({TOKEN: token, USERFULLNAME: ctx.params.account.name}, {
								where: {id: result.id},
								returning: true,
							})


							if (updatedNum[0] > 0) {

								let data = JSON.parse(JSON.stringify(await User.findOne({
									include: [{model: RequestGroup, as: 'RequestGroup'}, {
										model: OrganizationGroup,
										as: 'OrganizationGroup'
									}],
									where: {id: result.id}
								})))

								return {
									...data,
									USERPRIVILEGE: decrypt({
										iv: result.USERPRIVILEGE.split('@')[0],
										content: result.USERPRIVILEGE.split('@')[1]
									})
								}

							} else {
								ctx.meta.$statusCode = 400;
								return {message: "Bad request!"}
							}
						} else {
							ctx.meta.$statusCode = 401;
							return {message: "Unable to authenticate the account!"}
						}
					} else {
						ctx.meta.$statusCode = 204;
						return {message: "User account does not exists !"}
					}
				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
				}
			}
		},
		tokenVerifier: {
			async handler(ctx, route, req, res) {
				try {
					if (req.headers['authorization']) {
						const token = req.headers['authorization'].replace('Bearer ', '')
						let decodedU;
						try {
							decodedU = jwt.verify(token, process.env.admKey);
							if (decodedU) {

								let User = await ctx.call('users.model')
								const user = await User.findOne({
									where: {
										id: decodedU.id,
										'TOKEN': token
									}
								})

								if (user) {

									req.token = token
									req.user = user

								} else
									throw new Error('Invalid user token identifier')

							}

						} catch (e) {

							try {

								const decodedE = jwt.verify(token, process.env.empKey)
								if (decodedE) {

									let Employee = await ctx.call('employees.model')
									const employee = await Employee.findOne({
										where: {
											id: decodedE.id,
											'TOKEN': token
										}
									})

									if (employee) {

										req.token = token
										req.user = employee

									} else
										throw new Error('Invalid employee token identifier')

								}

							} catch (e) {

								try {

									const decodedR = jwt.verify(token, process.env.revKey)
									if (decodedR) {

										let Student = await ctx.call('students.model')
										const student = await Student.findOne({
											where: {
												id: decodedR.id,
												'TOKEN': token
											}
										})

										if (student) {

											req.token = token
											req.user = student

										} else
											throw new Error('Invalid employee token identifier')
									}

								} catch (e) {
									if (!(!ctx.params.apiGKey || ctx.params.apiGKey !== process.env.apiGKey)) {

										req.token = {}
										req.user = {}

									} else {
										throw new Error('Invalid token')
									}
								}
							}
						}
					} else {
						if (!(!ctx.params.req.query?.apiGKey || ctx.params.req.query?.apiGKey !== process.env.apiGKey)) {
							req.token = {}
							req.user = {}
						} else {
							throw new Error('Invalid token')
						}
					}
				} catch
					(e) {
					console.log(e)
					res.writeHead(401);
					return res.end(JSON.stringify({error: 'Please authenticate'}));
				}
			}

		}
	},

	methods: {
		async user() {
			return await this.broker.call('users.model')
		},
		async employee() {
			return await this.broker.call('students.model')
		}
	},
}
;
