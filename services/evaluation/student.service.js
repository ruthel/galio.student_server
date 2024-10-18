"use strict";

const adapter = require("../../adapter/mssql2");
const DbService = require("moleculer-db");
const Student = require("../../models/evaluation/Student");
const _ = require("lodash");
const request = require("request");
const {
	activationToCourse,
	closeConfirmationEmail,
	contactUs,
	contactHimWithRh,
	contactHim
} = require("../../helpers/mail");
const fs = require("fs");
const { callbackFolder } = require("../../helpers/func");
const { Sequelize } = require("sequelize");

module.exports = {
	name: "students",
	mixins: [DbService], adapter, model: Student,
	actions: {
		get: {
			params: {
				id: { type: "string" }
			},
			async handler(ctx) {
				try {

					let result = await this.adapter.model.findOne({ where: { STUDENT_ID: ctx.params.id } });
					result = JSON.parse(JSON.stringify(result));

					if (!result)
						ctx.meta.$statusCode = 400;
					return result;

				} catch (e) {
					console.log(e);
					ctx.meta.$statusCode = 500;
				}
			}
		},
		getEmployees: {
			async handler(ctx) {
				try {
					let result = await this.adapter.model.findAll();
					result = JSON.parse(JSON.stringify(result));

					if (result) {
						return result.map(employee => {
							let teacher = { ...employee };

							delete teacher.createdAt;
							delete teacher.updatedAt;
							delete teacher.SIGN_CODE;
							delete teacher.HOURRATE;
							delete teacher.ORGA1;
							delete teacher.ORGA2;
							delete teacher.ORGA3;
							delete teacher.ORGA4;
							delete teacher.ORGA5;
							delete teacher.LECTURER;
							delete teacher.TOKEN;
							delete teacher.EMAIL_VERIFICATION_TOKEN;

							return teacher;
						});
					} else
						ctx.meta.$statusCode = 204;

				} catch (e) {
					console.log(e);
					ctx.meta.$statusCode = 500;
				}
			}
		},
		import: {
			async handler(ctx) {
				try {

					console.log("\nstarting importation of employees list");

					let Employees = this.adapter.model;
					let url = `${process.env.academy}api/teacher/v1/LIST?ApiKey=${process.env.apiKey}&SchoolID=IUC&Year=${process.env.year}`;

					request({ url, agentOptions: { rejectUnauthorized: false } }, async function(err, response, body) {
						if (!err && response.statusCode === 200) {
							let objects = JSON.parse(body);
							console.log("\nfetching new data from employees list");
							let oldEmployeesList = await Employees.findAll();
							oldEmployeesList = JSON.parse(JSON.stringify(oldEmployeesList));
							await Employees.bulkCreate(_.uniqBy(objects, "Teacher_ID")?.filter(e => !oldEmployeesList.find(e2 => e2.STUDENT_ID === e.Teacher_ID)).map(elt => {
								return {
									STUDENT_ID: elt.Teacher_ID,
									FIRSTNAME: elt.Teacher_First_Name,
									LASTNAME: elt.Teacher_Last_Name,
									GENDER: elt.Teacher_Gender,
									BIRTHDATE: elt.Teacher_Birth_Date,
									BIRTHPLACE: elt.Teacher_Birth_Place,
									NUMPHONE: elt.Teacher_Phone_Number,
									EMAIL: elt.Teacher_Email,
									EMAIL_VERIFIED: false,
									ACTIVED: false
								};
							}));
							console.log("stopping importation of employees list\n");
						} else {
							console.log("error connection to academy", err);
						}
					});

				} catch (e) {
					console.log(e);
					ctx.meta.$statusCode = 500;
				}
			}
		},
		apiAll: {
			async handler(ctx) {
				try {
					let result = await this.adapter.model.findAll();
					result = JSON.parse(JSON.stringify(result));

					if (result) {
						return result.map(employee => {
							let teacher = { ...employee };

							delete teacher.createdAt;
							delete teacher.updatedAt;
							delete teacher.SIGN_CODE;
							delete teacher.HOURRATE;
							delete teacher.ORGA1;
							delete teacher.ORGA2;
							delete teacher.ORGA3;
							delete teacher.ORGA4;
							delete teacher.ORGA5;
							delete teacher.LECTURER;
							delete teacher.TOKEN;
							delete teacher.EMAIL_VERIFICATION_TOKEN;

							return teacher;
						});
					} else
						ctx.meta.$statusCode = 204;

				} catch (e) {
					console.log(e);
					ctx.meta.$statusCode = 500;
				}
			}
		},
		verification: {
			async handler(ctx) {
				try {
					let data = ctx.params;
					for (let prop of Object.keys(data))
						if (data[prop] === "")
							data[prop] = null;
					let result = await this.adapter.model.update(data, {
						where: { EMAIL: data.EMAIL },
						returning: true
					});
					result = JSON.parse(JSON.stringify(result));
					if (result) {
						if (data.ACCESS_COURSES)
							return result;
						else {
							ctx.meta.$statusCode = 401;
							return {}
						}
					} else {
						ctx.meta.$statusCode = 404;
						return { message: "Student not found" };
					}
				} catch (e) {
					console.log(e);
					ctx.meta.$statusCode = 500;
				}
			}
		},
		validationRh: {
			async handler(ctx) {
				try {
					let data = ctx.params;

					for (let prop of Object.keys(data))
						if (data[prop] === "")
							data[prop] = null;
					let result = await this.adapter.model.update(data, {
						where: { STUDENT_ID: data.STUDENT_ID },
						returning: true
					});
					result = JSON.parse(JSON.stringify(result));
					if (result) {
						if (data.VALUE === "COURSE" && data.ACCESS_COURSES)
							await activationToCourse(result[1][0]);
						return result;
					} else {
						ctx.meta.$statusCode = 400;
						return { message: "Bad request" };
					}
				} catch (e) {
					console.log(e);
					ctx.meta.$statusCode = 500;
				}
			}
		},
		uploadCV: {
			async handler(ctx) {
				try {

					let data = ctx.params;

					if (data.FILE) {

						let base64Parts = data.FILE?.split(";base64,");
						let ext = base64Parts[0]?.split("/")?.pop();
						let base64 = base64Parts?.pop();

						fs.mkdir(`upload/${data.STUDENT_ID}`, callbackFolder);
						fs.writeFile(`upload/${data.STUDENT_ID}/cv.${ext}`, base64, "base64", callbackFolder);

						data.CV_LINK = `${process.env.server_root}upload/${data.STUDENT_ID}/cv.${ext}`;

						for (let prop of Object.keys(data))
							if (data[prop] === "")
								data[prop] = null;

						let result = await this.adapter.model.update(data, {
							where: { STUDENT_ID: data.STUDENT_ID },
							returning: true
						});

						result = JSON.parse(JSON.stringify(result));
						if (result) {
							if (data.VALUE === "COURSE" && data.ACCESS_COURSES)
								await activationToCourse(result[1][0]);
							return result[1][0];
						} else {
							ctx.meta.$statusCode = 400;
							return { message: "Bad request" };
						}
					} else {
						ctx.meta.$statusCode = 400;
						return { message: "Bad request" };
					}

				} catch (e) {
					console.log(e);
					ctx.meta.$statusCode = 500;
				}
			}
		},
		closeSign: {
			async handler(ctx) {
				try {
					console.log(ctx.params);
					if (ctx.params.STUDENT_ID) {
						let result = await this.broker.call("students.get", { id: ctx.params.STUDENT_ID });
						result = JSON.parse(JSON.stringify(result));
						let object = result;

						let resClose = await this.adapter.model.update({ ACTIVED: true }, { where: { STUDENT_ID: result.STUDENT_ID } });
						await closeConfirmationEmail(object);

						if (resClose)
							return result;
						else {
							ctx.meta.$statusCode = 400;
							return { message: "An error occurred" };
						}
					} else {
						ctx.meta.$statusCode = 404;
						return { message: "impossible de poursuivre l'opération" };
					}

				} catch (e) {
					console.log(e);
					ctx.meta.$statusCode = 500;
				}
			}
		},
		update: {
			async handler(ctx) {
				try {
					let object = { ...ctx.params.data };
					for (let prop of Object.keys(ctx.params.data))
						if (object[prop] === "")
							object[prop] = null;

					console.log(object);

					let result = await this.adapter.model.update(object, {
						where: { STUDENT_ID: object.STUDENT_ID },
						returning: true
					});

					result = JSON.parse(JSON.stringify(result));

					if (ctx.params.data.VALUE === "COURSE" && ctx.params.data.ACCESS_COURSES) {
						await activationToCourse(result[1][0]);
					}

					return result;

				} catch (e) {
					console.log(e);
					ctx.meta.$statusCode = 500;
				}
			}
		},
		updateCV: {
			async handler(ctx) {
				try {
					let data = await this.adapter.model.update({ CV_LINK: "OK" }, {
						where: { STUDENT_ID: ctx.params.STUDENT_ID },
						returning: true
					});
					if (data)
						return {
							OK: true
						};
				} catch (e) {
					console.log(e);
					ctx.meta.$statusCode = 500;
				}
			}
		},
		setGmailAccount: {
			async handler(ctx) {
				try {
					let exist = await this.adapter.model.findOne({ where: { GMAIL_ACCOUNT: ctx.params.GMAIL_ACCOUNT } });
					if (!exist) {
						let emp = await this.adapter.model.update({ GMAIL_ACCOUNT: ctx.params.GMAIL_ACCOUNT }, { where: { STUDENT_ID: ctx.params.STUDENT_ID } });
						if (emp)
							return { data: "ok" };
						else {
							ctx.meta.$statusCode = 400;
							return { message: "Bad request !" };
						}
					} else {
						ctx.meta.$statusCode = 409;
						return { message: "gmail account already exist !" };
					}
				} catch (e) {
					console.log(e);
					ctx.meta.$statusCode = 500;
				}
			}
		},
		setUserActive: {
			async handler(ctx) {
				try {
					let data = ctx.params;
					let result = await this.broker.call("employees.update", { data });
					if (result)
						return data;
					else {
						ctx.meta.$statusCode = 400;
						return { message: "missing or incorrect parameters" };
					}
				} catch (e) {
					console.log(e);
					ctx.meta.$statusCode = 500;
				}
			}
		},
		defineLastDocument: {
			async handler(ctx) {
				try {
					if (ctx.params.id && ctx.params.STUDENT_ID) {
						let result = await this.adapter.model.update({
							LASTDIPLOMA: ctx.params.id
						}, {
							where: {
								STUDENT_ID: ctx.params.STUDENT_ID
							}
						});
						if (result[0] >= 1) {
							return result;
						} else {
							ctx.meta.$statusCode = 400;
							return { message: "Unknown error occurred" };
						}
					} else {
						ctx.meta.$statusCode = 400;
						return { message: "Invalid or missing parameters" };
					}
				} catch (e) {
					console.log(e);
					ctx.meta.$statusCode = 500;
				}
			}
		},
		contactUs: {
			async handler(ctx) {
				try {
					let result = await contactUs({ ...ctx.params });
					if (result) {
						return result;
					} else {
						ctx.meta.$statusCode = 400;
						return { message: "Bad request" };
					}
				} catch (e) {
					console.log(e);
					ctx.meta.$statusCode = 500;
				}
			}
		},
		contactHim: {
			async handler(ctx) {
				try {
					const { DESIGNATION, EMPLOYEE } = ctx.params;
					let result;
					if (EMPLOYEE) {
						for (const employee of EMPLOYEE) {
							if (employee.EMAIL)
								if (ctx.params.isRH) {
									await contactHimWithRh({ DESIGNATION, EMPLOYEE: employee });
								} else {
									await contactHim({ DESIGNATION, EMPLOYEE: employee });
								}
						}
						result = true;
					} else {
						ctx.meta.$statusCode = 400;
						return { message: "Bad request" };
					}
				} catch (e) {
					console.log(e);
					ctx.meta.$statusCode = 500;
				}
			}
		},
		updatePart: {
			params: {
				part: { type: "string" }
			},
			async handler(ctx) {
				try {
					let data = ctx.params;
					await this.broker.call("students.update", { data });
				} catch (e) {
					console.log(e);
					ctx.meta.$statusCode = 500;
				}
			}
		},
		removeFile: {
			async handler(ctx) {
				try {
					let data = ctx.params;
					console.log(data);
					if (data.file) {
						try {
							fs.unlinkSync(`upload/${data.file}/${data.file.split("upload/")[1]}`);
						} catch (e) {
							console.log(e);
						}
					}
					let newValue = {};
					newValue[data.col] = null;

					let result = await this.adapter.model.update(newValue, { where: { STUDENT_ID: data.STUDENT_ID } });
					if (result)
						return result;
					else {
						ctx.meta.$statusCode = 400;
						return { message: "Bad request" };
					}
				} catch (e) {
					console.log(e);
					ctx.meta.$statusCode = 500;
				}
			}
		},
		listSubject: {
			async handler(ctx) {

				let StudentSubject = await this.broker.call("studentSubjects.model");
				let Subject = await this.broker.call("subjects.model");
				let Student = await this.broker.call("students.model");
				let Evaluations = await this.broker.call("evaluations.model");
				let Employees = await this.broker.call("employees.model");
				let EvaluationForms = await this.broker.call("evaluationForms.model");
				let EvaluationSessions = await this.broker.call("evaluationSessions.model");
				let StudentEvalSessions = await this.broker.call("studentEvaluationSessions.model");

				let student = JSON.parse(JSON.stringify(await Student.findOne({ where: { STUDENT_ID: ctx.params.MATRICULE } })));
				try {
					StudentSubject.belongsTo(Subject, { foreignKey: "SUBJECT_ID", targetKey: "SUBJECT_ID" });
				} catch (e) {
				}
				try {
					Subject.belongsTo(Evaluations, { foreignKey: "SUBJECT_ID", targetKey: "SUBJECT_ID" });
					Evaluations.hasMany(Subject, { foreignKey: "SUBJECT_ID", targetKey: "SUBJECT_ID" });
				} catch (e) {
				}
				// try {
				// 	Evaluations.belongsTo(EvaluationSessions, {
				// 		foreignKey: 'EVALUATION_SESSION_ID', targetKey: 'EVALUATION_SESSION_ID'
				// 	});
				// } catch (e) {
				// 	console.log(e)
				// }
				// try {
				// 	Evaluations.belongsTo(Employees, {foreignKey: 'EMPLOYEE_ID', targetKey: 'MATRICULE'});
				// } catch (e) {
				// 	console.log(e)
				// }
				// try {
				// 	EvaluationSessions.belongsTo(EvaluationForms, {
				// 		foreignKey: 'EVALUATION_SESSION_ID', targetKey: 'EVALUATION_SESSION_ID'
				// 	});
				// } catch (e) {
				// 	console.log(e)
				// }
				// try {
				// 	StudentSubject.belongsTo(StudentEvaluationSessions, {
				// 		foreignKey: 'STUDENT_ID', targetKey: 'STUDENT_ID'
				// 	});
				// } catch (e) {
				// 	console.log(e)
				// }
				// try {
				// 	StudentEvaluationSessions.belongsTo(EvaluationSessions, {
				// 		foreignKey: 'EVALUATION_SESSION_ID', targetKey: 'EVALUATION_SESSION_ID'
				// 	});
				// } catch (e) {
				// 	console.log(e)
				// }

				let result = JSON.parse(JSON.stringify(await StudentSubject.findAll({
					attributes: ["id", "STUDENT_ID"],
					where: { STUDENT_ID: student.STUDENT_ID, CLASS_ID: student.CLASS_ID },
					include: [
						{
							model: Subject,
							where: { CLASS_ID: student.CLASS_ID },
							attributes: ["SUBJECT_NAME", "SUBJECT_ID"],
							required: true,
							include: {
								model: Evaluations,
								required: true,
								attributes: ["EVALUATION_SESSION_ID", "EMPLOYEE_ID"],
								where: {
									CLASS_ID: student.CLASS_ID
								}
								// 	{
								// 		model: EvaluationSessions,
								// 		attributes: ['LABEL'],
								// 		required: true,
								// 		where: {ACTIVATED: true},
								// 		// include: {model: EvaluationForms, attributes: ['LABEL', 'id']}
								// 	},
							}
						}]
				})));

				result = await Promise.all(_.uniqBy(result, i => i.SUBJECT_ID + i.STUDENT_ID).map(async ss => {
					let subject = JSON.parse(JSON.stringify(ss));
					subject.EMPLOYEE = await Employees.findOne({
						where: { MATRICULE: subject.SUBJECT.EVALUATION.EMPLOYEE_ID },
						attributes: ["id", "MATRICULE"],
						raw: true
					});
					console.log(subject);
					subject.STUDENT_EVALUATION_SESSION = await StudentEvalSessions.findOne({ where: { STUDENT_ID: subject.STUDENT_ID } });
					return subject;
				}));
				return result;

			}
		},
		model: {
			async handler() {
				return this.model;
			}
		}
	},

	/**
	 * Service started lifecycle event handler
	 */
	async started() {
		await this.adapter.model.sync({ force: false });
	},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {
	}
};
