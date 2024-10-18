"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const Employee = require("../../models/common/Employee");
const {
	activationToCourse,
	closeConfirmationEmail,
	contactUs,
	contactHimWithRh,
	contactHim
} = require("../../helpers/mail");
const fs = require("fs");
const {callbackFolder} = require("../../helpers/func");
const request = require("request");
const _ = require("lodash");

module.exports = {
	name: "employees",

	mixins: [DbService],
	adapter,
	model: Employee,

	actions: {
		get: {
			params: {
				id: {type: 'string'}
			},
			async handler(ctx) {
				try {

					let result = await this.adapter.model.findOne({where: {MATRICULE: ctx.params.id}});
					result = JSON.parse(JSON.stringify(result))

					if (!result)
						ctx.meta.$statusCode = 400;
					return result

				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
				}
			}
		},
		getEmployees: {
			async handler(ctx) {
				try {
					let result = await this.adapter.model.findAll();
					result = JSON.parse(JSON.stringify(result))

					if (result) {
						return result.map(employee => {
							let teacher = {...employee}

							delete teacher.createdAt
							delete teacher.updatedAt
							delete teacher.SIGN_CODE
							delete teacher.HOURRATE
							delete teacher.ORGA1
							delete teacher.ORGA2
							delete teacher.ORGA3
							delete teacher.ORGA4
							delete teacher.ORGA5
							delete teacher.LECTURER
							delete teacher.TOKEN
							delete teacher.EMAIL_VERIFICATION_TOKEN

							return teacher
						})
					} else
						ctx.meta.$statusCode = 204;

				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
				}
			}
		},
		import: {
			async handler(ctx) {

			}
		},
		apiAll: {
			async handler(ctx) {
				try {
					let result = await this.adapter.model.findAll();
					result = JSON.parse(JSON.stringify(result))

					if (result) {
						return result.map(employee => {
							let teacher = {...employee}

							delete teacher.createdAt
							delete teacher.updatedAt
							delete teacher.SIGN_CODE
							delete teacher.HOURRATE
							delete teacher.ORGA1
							delete teacher.ORGA2
							delete teacher.ORGA3
							delete teacher.ORGA4
							delete teacher.ORGA5
							delete teacher.LECTURER
							delete teacher.TOKEN
							delete teacher.EMAIL_VERIFICATION_TOKEN

							return teacher
						})
					} else
						ctx.meta.$statusCode = 204;

				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
				}
			}
		},
		validationRh: {
			async handler(ctx) {
				try {
					let data = ctx.params

					for (let prop of Object.keys(data))
						if (data[prop] === '')
							data[prop] = null
					let result = await this.adapter.model.update(data, {
						where: {MATRICULE: data.MATRICULE},
						returning: true
					})
					result = JSON.parse(JSON.stringify(result))
					if (result) {
						if (data.VALUE === 'COURSE' && data.ACCESS_COURSES)
							await activationToCourse(result[1][0])
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
		uploadCV: {
			async handler(ctx) {
				try {

					let data = ctx.params

					if (data.FILE) {

						let base64Parts = data.FILE?.split(';base64,');
						let ext = base64Parts[0]?.split('/')?.pop();
						let base64 = base64Parts?.pop();

						fs.mkdir(`upload/${data.MATRICULE}`, callbackFolder)
						fs.writeFile(`upload/${data.MATRICULE}/cv.${ext}`, base64, 'base64', callbackFolder);

						data.CV_LINK = `${process.env.server_root}upload/${data.MATRICULE}/cv.${ext}`

						for (let prop of Object.keys(data))
							if (data[prop] === '')
								data[prop] = null

						let result = await this.adapter.model.update(data, {
							where: {MATRICULE: data.MATRICULE},
							returning: true
						})

						result = JSON.parse(JSON.stringify(result))
						if (result) {
							if (data.VALUE === 'COURSE' && data.ACCESS_COURSES)
								await activationToCourse(result[1][0])
							return result[1][0]
						} else {
							ctx.meta.$statusCode = 400;
							return {message: 'Bad request'}
						}
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
		closeSign: {
			async handler(ctx) {
				try {

					if (ctx.params.MATRICULE) {
						let result = await this.broker.call('employees.get', {id: ctx.params.MATRICULE})
						result = JSON.parse(JSON.stringify(result))

						let object = result
						let columns = [
							'LASTEMPLOYER',
							'LASTJOB',
							'LASTJOBEND',
							'LASTJOBSTART',
							'LASTJOBSTILL',
							'CIVILSTATUS',
							'SPFIRSTNAME',
							'SPLASTNAME',
							'SPBIRTHDATE',
							'CHILDNUM',
							'EMERGNUM1',
							'EMERGNAME1',
							'LASTDIPLOMA',
							'LASTSPECIALTY',
							'OBTENYEAR',
							'OBTENESTAB',
							'NUMPHONE',
							'NUMPHONE2',
							'TOWN',
							'COUNTRY',
							// 'DISTRICT',
							'PRECINCT',
							'PAYMODE',
							// 'CASHIER_CODE',
							'ACCOUNT_BIRTHDATE',
							'ACCOUNT_NUM',
							'ACTIVITY_PRINCIPAL',
							'ACCOUNT_LASTNAME',
							'ACCOUNT_FIRSTNAME',
							// 'RIB_KEY',
							'NIU',
							'GRADES', 'TITLE', 'SPECIALITY',
							'CNPSYN',
							'IDENTIFICATION',
							'IDENTIFNUM',
							'IDENTIFPLACE',
							'IDENTIFSTART',
							'IDENTIFEND',
							'MATRICULE',
							'STATUS',
							'GENDER',
							'BIRTHDATE',
							'BIRTHPLACE',
							'COUNTRY',
							'MAIL',
							// 'CV_LINK',
							'IDENTITY1',
							'IDENTITY2',
						]

						let missing = []

						for (let col of columns)
							if (object[col] === null) {
								if (col === 'LASTJOBEND' && (!object['LASTJOBSTILL'] || object['LASTJOBSTILL']?.toString() === '0'))
									missing.push(col)
								else if (['SPFIRSTNAME', 'SPLASTNAME', 'SPBIRTHDATE'].includes(col) && object['CIVILSTATUS'] === 'Maried')
									missing.push(col)
								else if (col === 'CNPSNUM' && object['CNPSYN'])
									missing.push(col)
								else if (!['SPFIRSTNAME', 'SPLASTNAME', 'SPBIRTHDATE', 'LASTJOBEND', 'CNPSNUM'].includes(col))
									missing.push(col)
							}

						if (missing.length > 0) {
							ctx.meta.$statusCode = 400;
							return {message: "column manquantes", columns: missing}
						}

						let resClose = await this.adapter.model.update({ACTIVED: true}, {where: {MATRICULE: result.MATRICULE}})
						await closeConfirmationEmail(object)

						if (resClose)
							return result
						else {
							ctx.meta.$statusCode = 400;
							return {message: "An error occurred"}
						}
					} else {
						ctx.meta.$statusCode = 404;
						return {message: "impossible de poursuivre l'opération"}
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
					let object = {...ctx.params.data}
					for (let prop of Object.keys(ctx.params.data))
						if (object[prop] === '')
							object[prop] = null

					let result = await this.adapter.model.update(object, {
						where: {MATRICULE: object.MATRICULE},
						returning: true
					})

					result = JSON.parse(JSON.stringify(result))

					if (ctx.params.data.VALUE === 'COURSE' && ctx.params.data.ACCESS_COURSES) {
						await activationToCourse(result[1][0])
					}

					return result

				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
				}
			}
		},
		updateCV: {
			async handler(ctx) {
				try {
					let data = await this.adapter.model.update({CV_LINK: 'OK'}, {
						where: {MATRICULE: ctx.params.MATRICULE},
						returning: true
					})
					if (data)
						return {
							OK: true
						}
				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
				}
			}
		},
		setGmailAccount: {
			async handler(ctx) {
				try {
					let exist = await this.adapter.model.findOne({where: {GMAIL_ACCOUNT: ctx.params.GMAIL_ACCOUNT}})
					if (!exist) {
						let emp = await this.adapter.model.update({GMAIL_ACCOUNT: ctx.params.GMAIL_ACCOUNT}, {where: {MATRICULE: ctx.params.MATRICULE}})
						if (emp)
							return {data: 'ok'}
						else {
							ctx.meta.$statusCode = 400;
							return {message: 'Bad request !'}
						}
					} else {
						ctx.meta.$statusCode = 409;
						return {message: 'gmail account already exist !'}
					}
				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
				}
			}
		},
		setUserActive: {
			async handler(ctx) {
				try {
					let data = ctx.params
					let result = await this.broker.call('employees.update', {data})
					if (result)
						return data
					else {
						ctx.meta.$statusCode = 400;
						return {message: 'missing or incorrect parameters'}
					}
				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
				}
			}
		},
		defineLastDocument: {
			async handler(ctx) {
				try {
					if (ctx.params.id && ctx.params.MATRICULE) {
						let result = await this.adapter.model.update({
							LASTDIPLOMA: ctx.params.id
						}, {
							where: {
								MATRICULE: ctx.params.MATRICULE
							}
						})
						if (result[0] >= 1) {
							return result
						} else {
							ctx.meta.$statusCode = 400;
							return {message: 'Unknown error occurred'}
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
		contactUs: {
			async handler(ctx) {
				try {
					let result = await contactUs({...ctx.params})
					if (result) {
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
		contactHim: {
			async handler(ctx) {
				try {
					const {DESIGNATION, EMPLOYEE} = ctx.params;
					let result;
					if (EMPLOYEE) {
						for (const employee of EMPLOYEE) {
							if (employee.EMAIL)
								if (ctx.params.isRH) {
									await contactHimWithRh({DESIGNATION, EMPLOYEE: employee});
								} else {
									await contactHim({DESIGNATION, EMPLOYEE: employee});
								}
						}
						result = true
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
		updatePart: {
			params: {
				part: {type: 'string'},
			},
			async handler(ctx) {
				try {
					let data = ctx.params
					let keys;
					switch (ctx.params.part) {
						case 'personal':
							keys = ['LASTNAME', 'FIRSTNAME', 'DENOMINATION', 'BIRTHPLACE', 'BIRTHDATE', 'GENDER', 'COUNTRY', 'MATRICULE'];
							break
						case 'status':
							keys = ['STATUS', 'MATRICULE'];
							break
						case 'professional':
							keys = ['LASTEMPLOYER', 'LASTJOB', 'LASTJOBEND', 'LASTJOBSTART', 'LASTJOBSTILL', 'ACTIVITY_PRINCIPAL', 'MATRICULE', 'GRADES', 'TITLE', 'SPECIALITY']
							break
						case 'familial':
							keys = ['CIVILSTATUS', 'SPFIRSTNAME', 'SPLASTNAME', 'SPBIRTHDATE', 'CHILDNUM', 'EMERGNUM1', 'EMERGNAME1', 'MATRICULE']
							break
						case 'address':
							keys = ['NUMPHONE', 'NUMPHONE2', 'TOWN', 'DISTRICT', 'MATRICULE', 'ORIGIN_REGION']
							break
						case 'identification':
							let base64Parts1 = data.IDENTITY1.split(';base64,')
							let base641 = base64Parts1.pop();

							let base64Parts2 = data.IDENTITY2.split(';base64,')
							let base642 = base64Parts2.pop();

							fs.mkdir(`upload/${data.MATRICULE}`, callbackFolder)
							let path1 = `upload/${data.MATRICULE}/${data.IDENTIFICATION}_${data.IDENTIFNUM}_recto.pdf`
							fs.writeFile(path1, base641, 'base64', callbackFolder);

							let path2 = `upload/${data.MATRICULE}/${data.IDENTIFICATION}_${data.IDENTIFNUM}_verso.pdf`
							fs.writeFile(path2, base642, 'base64', callbackFolder);
							'GRADES', 'TITLE', 'SPECIALITY'
							data.IDENTITY1 = `${process.env.server_root}${path1}`
							data.IDENTITY2 = `${process.env.server_root}${path2}`

							keys = ['IDENTIFICATION', 'IDENTIFNUM', 'IDENTIFPLACE', 'IDENTIFSTART', 'IDENTIFEND', 'MATRICULE']
							break
						case 'identification_passport':

							let base64Passport1 = data.IDENTITY1_PASSPORT?.split(';base64,')
							fs.mkdir(`upload/${data.MATRICULE}`, callbackFolder)

							if (base64Passport1) {
								let base64Pass1 = base64Passport1.pop();
								let pathPassport1 = `upload/${data.MATRICULE}/${data.IDENTIFICATION_PASSPORT}_${data.IDENTIFNUM_PASSPORT}_recto.pdf`
								fs.writeFile(pathPassport1, base64Pass1, 'base64', callbackFolder);
								data.IDENTITY1_PASSPORT = `${process.env.server_root}${pathPassport1}`
							}

							let base64Passport2 = data.IDENTITY2_PASSPORT?.split(';base64,')
							if (base64Passport2) {
								let base64Pass2 = base64Passport2.pop();
								let pathPassport2 = `upload/${data.MATRICULE}/${data.IDENTIFICATION_PASSPORT}_${data.IDENTIFNUM_PASSPORT}_verso.pdf`
								fs.writeFile(pathPassport2, base64Pass2, 'base64', callbackFolder);
								data.IDENTITY2_PASSPORT = `${process.env.server_root}${pathPassport2}`
							}
							keys = ['IDENTIFICATION_PASSPORT', 'IDENTIFNUM_PASSPORT', 'IDENTIFPLACE_PASSPORT', 'IDENTIFSTART_PASSPORT', 'IDENTIFEND_PASSPORT', 'MATRICULE']
							break
						case 'financial':
							if (data.PRESENCE_ATTEST && data.PRESENCE_ATTEST.includes('base64')) {

								let base64PartsPRE = data.PRESENCE_ATTEST?.split(';base64,');
								let extPRE = base64PartsPRE[0]?.split('/')?.pop();
								let base64PRE = base64PartsPRE?.pop();

								fs.mkdir(`upload/${data.MATRICULE}`, callbackFolder)
								let pathPRE = `upload/${data.MATRICULE}/presence_attestation.${extPRE}`
								fs.writeFile(pathPRE, base64PRE, 'base64', callbackFolder);

								data.PRESENCE_ATTEST = `${process.env.server_root}${pathPRE}`

							}

							if (data.MINISTERIAL_DECREE && data.MINISTERIAL_DECREE.includes('base64')) {
								let base64PartsMIN = data.MINISTERIAL_DECREE?.split(';base64,');
								let extMIN = base64PartsMIN[0]?.split('/')?.pop();
								let base64MIN = base64PartsMIN?.pop();

								fs.mkdir(`upload/${data.MATRICULE}`, callbackFolder)
								let pathMIN = `upload/${data.MATRICULE}/ministerial_decree.${extMIN}`
								fs.writeFile(pathMIN, base64MIN, 'base64', callbackFolder);

								data.MINISTERIAL_DECREE = `${process.env.server_root}${pathMIN}`
							}

							if (data.NIU_LINK && data.NIU_LINK.includes('base64')) {
								let base64PartsNIU = data.NIU_LINK?.split(';base64,');
								let extNIU = base64PartsNIU[0]?.split('/')?.pop();
								let base64NIU = base64PartsNIU?.pop();

								fs.mkdir(`upload/${data.MATRICULE}`, callbackFolder)
								let pathNIU = `upload/${data.MATRICULE}/niu.${extNIU}`
								fs.writeFile(pathNIU, base64NIU, 'base64', callbackFolder);

								data.NIU_LINK = `${process.env.server_root}${pathNIU}`
							}

							keys = ['NIU', 'CNPSYN', 'CNPSNUM', 'MATRICULE']
							break
						case 'pay-mode':
							if (data.RIB_LINK && data.RIB_LINK.includes('base64')) {
								let base64PartsRIB = data.RIB_LINK?.split(';base64,');
								let extRIB = base64PartsRIB[0]?.split('/')?.pop();
								let base64RIB = base64PartsRIB?.pop();

								fs.mkdir(`upload/${data.MATRICULE}`, callbackFolder)
								let pathRIB = `upload/${data.MATRICULE}/rib.${extRIB}`
								fs.writeFile(pathRIB, base64RIB, 'base64', callbackFolder);
								data.RIB_LINK = `${process.env.server_root}${pathRIB}`
							}

							keys = ['PAYMODE',
								// 'CASHIER_CODE',
								'ACCOUNT_BIRTHDATE',
								'ACCOUNT_NUM',
								'ACCOUNT_LASTNAME',
								'ACCOUNT_FIRSTNAME',
								'MATRICULE']
							break
					}

					// if (!Object.keys(data).includes(eltKey)) {
					// 	console.log(elt.Key, keys, data)
					// 	ctx.meta.$statusCode = 400;
					// 	return {message: 'missing or incorrect parameters'}
					// }

					// console.log(data)
					await this.broker.call('employees.update', {data})
					// if (result)
					//   return data
					// else {
					//   ctx.meta.$statusCode = 400;
					//   return {message: 'missing or incorrect parameters'}
					// }
				} catch (e) {
					console.log(e)
					ctx.meta.$statusCode = 500;
				}
			}
		},
		removeFile: {
			async handler(ctx) {
				try {
					let data = ctx.params
					console.log(data)
					if (data.file) {
						try {
							fs.unlinkSync(`upload/${data.file}/${data.file.split('upload/')[1]}`)
						} catch (e) {
							console.log(e)
						}
					}
					let newValue = {}
					newValue[data.col] = null;

					let result = await this.adapter.model.update(newValue, {where: {MATRICULE: data.MATRICULE}});
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
			async handler() {
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
;
