const request = require("request");
const Cron = require("moleculer-cron");
const _ = require("lodash");
const { Op, Transaction } = require("sequelize");
const axios = require("axios");
const https = require("https");
const fs = require("fs");
const path = require("node:path");

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

module.exports = {
	name: "imports",
	mixins: [Cron],
	crons: [
		{
			name: "imp_classes",
			cronTime: process.env.imp_classes,
			onTick: async function() {
				console.log("\nStarting importation of classes list");
				let Classes = await this.call("classes.model");
				request.get({
					url: `${process.env.academy}api/class/v1/LIST?ApiKey=${process.env.apiKey}&Year=${process.env.year}&SchoolID=${process.env.school}`,
					agentOptions: { rejectUnauthorized: false }
				}, async function(err, res, body) {
					if (!err && res.statusCode === 200) {
						let array = JSON.parse(body);
						console.log("=================================================================");
						console.log("Fetching new data from classes", array.length, "found");
						let classes = JSON.parse(JSON.stringify((await Classes.findAll())));
						let added = 0;
						await Classes.bulkCreate(array.filter(elt => !classes.find(e => e?.CLASS_ID === elt.Class_ID)).map(elt => {
							added++;
							return {
								CLASS_ID: elt.Class_ID,
								CLASS_NAME: elt.Class_Name,
								SPECIALTY_ID: elt.Speciality_ID,
								SPECIALTY_NAME: elt.Speciality_Name,
								SPECIALTY_DESCRIPTION: elt.Speciality_Description,
								LEVEL_ID: elt.Level_ID,
								LEVEL_NAME: elt.Level_Name,
								BRANCH_ID: elt.Branch_ID,
								BRANCH_ABREVIATION: elt.Branch_Abreviation,
								BRANCH_NAME: elt.Branch_Name,
								CYCLE_ID: elt.Cycle_ID,
								CYCLE_NAME: elt.Cycle_Name
							};
						}));
						await Classes.destroy({ where: { CLASS_ID: { [Op.notIn]: array.map(cl => cl.Class_ID) } } });
						console.log("=================================================================");
						console.log("Stopping importation of classes", added, "Rows added");
					} else
						console.log("error connection to academy");
				});

			},
			runOnInit: function() {
				console.log("Services cron on for classes importations");
			},
			timeZone: process.env.timeZone
		},
		{
			name: "imp_students",
			cronTime: "0 08 16 * * *" || process.env.imp_students,
			onTick: async function() {

				let filePath = path.join(__dirname, "log", "imported", "class_students.json");
				let fileContents = [];

				if (fs.existsSync(filePath))
					fileContents = JSON.parse(fs.readFileSync(filePath, "utf8"));
				else fs.writeFileSync(filePath, JSON.stringify([]), "utf8");

				console.log("\nStarting importation of students list");

				let Classes = await this.call("classes.model");
				let Students = await this.call("students.model");

				let classes = JSON.parse(JSON.stringify(await Classes.findAll({ attributes: ["CLASS_ID"] })));
				let oldStudentsList = JSON.parse(JSON.stringify(await Students.findAll()));

				for (const cls of classes.filter(cl => !fileContents.includes(cl.CLASS_ID))) {
					let retry = 0;
					let success = false;
					do {
						try {
							let url = `${process.env.academy}api/student/v1/REGISTRATIONS/YEAR/CLASS?ApiKey=${process.env.apiKey}&SchoolID=${process.env.school}&Year=${process.env.year}&ClassID=${cls.CLASS_ID}`;
							let object = await axios.get(url, { httpsAgent });
							console.log(object.data.length, "Found");
							let objects = object.data.filter(elt => !!elt.Student_Email && !!elt.Registration_ID && !!elt.Student_ID_School);
							if (object.status === 200) {
								let notInsertedStudents = _.uniqBy(objects, "Student_ID_School")?.filter(e => !oldStudentsList.find(e2 => e2.STUDENT_ID === e.Student_ID_School));
								if (notInsertedStudents.length > 0)
									try {
										await Students.bulkCreate(notInsertedStudents.map(elt => ({
											STUDENT_ID: elt.Student_ID_School,
											LASTNAME: elt.Student_Last_Name,
											FIRSTNAME: elt.Student_First_Name,
											GENDER: elt.Student_Gender,
											REGISTRATION_ID: elt.Registration_ID,
											REGISTRATION_TYPE: elt.Registration_Type,
											EMAIL: elt.Student_Email,
											CLASS_ID: cls.CLASS_ID,
											EMAIL_VERIFIED: 0,
											ACCESS_COURSES: 0
										})));
										fileContents.push(cls.CLASS_ID);
										success = true;
									} catch (e) {
										fs.writeFileSync(filePath, JSON.stringify(fileContents), "utf8");
										console.log("Error when using inserting list of student of class", cls.CLASS_ID);
										console.log(e.message);
									}
								else {
									fileContents.push(cls.CLASS_ID);
									success = true;
								}
								if (fileContents.length % 50 === 0)
									fs.writeFileSync(filePath, JSON.stringify(fileContents), "utf8");
							} else console.log("Error connection to academy");
							console.log(`[${classes.indexOf(cls) + 1}/${classes.length}] - `, cls.CLASS_ID, "fetch", object.data.length, "row(s)", retry, "Retries");
						} catch (e) {
							if (retry === process.env.MAX_ACADEMY_RETRY) {
								fs.writeFileSync(filePath, JSON.stringify(fileContents), "utf8");
								console.log("Error went trying to fetch students for class", cls.CLASS_ID);
							}
						}
						retry++;
					} while (!success && retry <= process.env.MAX_ACADEMY_RETRY);
				}
				fs.writeFileSync(filePath, JSON.stringify(fileContents), "utf8");
				console.log("Stopping importation of students list\n");
			},
			runOnInit: function() {
				console.log("Services cron on for employees importations");
			},
			timeZone: process.env.timeZone
		},
		{
			name: "imp_subjects",
			cronTime: process.env.imp_subjects,
			onTick: async function() {

				let filePath = path.join(__dirname, "log", "imported", "class_subjects.json");
				let fileContents = [];

				if (fs.existsSync(filePath))
					fileContents = JSON.parse(fs.readFileSync(filePath, "utf8"));
				else fs.writeFileSync(filePath, JSON.stringify([]), "utf8");

				let Classes = await this.call("classes.model");
				let Subject = await this.call("subjects.model");

				console.log("\nStarting importation of subjects list");
				let classes = JSON.parse(JSON.stringify(await Classes.findAll()));
				let subjects = JSON.parse(JSON.stringify(await Subject.findAll()));

				for (let cls of classes.filter(cl => !fileContents.includes(cl.CLASS_ID))) {
					let retry = 0;
					let success = false;
					do {
						try {
							const url = `${process.env.academy}api/subject/v1/LIST/CLASS?ApiKey=${process.env.apiKey}&Year=${process.env.year}&SchoolID=${process.env.school}&ClassID=${cls.CLASS_NAME}`;
							let object = await axios.get(url, { httpsAgent });
							let objects = object.data;
							if (object.status === 200) {
								let notInsertedSubjects = objects.filter(elt => !subjects.find(e => e.SUBJECT_ID === elt.Subject_ID));
								if (notInsertedSubjects.length > 0)
									try {
										await Subject.bulkCreate(notInsertedSubjects.map((sub, i, arr) => {
											return {
												CLASS_ID: sub.Class_ID,
												SUBJECT_ID: sub.Subject_ID,
												SUBJECT_NAME: sub.Subject_Name,
												SUBJECT_SHORTNAME: sub.Subject_Name?.split(" (")[0] || "",
												LEVEL_ID: sub.Level_ID,
												SUBJECT_STATUS: sub.Subject_Status,
												SUBJECT_ABREVIATION: sub.Subject_Abreviation,
												SUBJECT_VH_AB_INITIAL: sub.Subject_VH_AB_Initial,
												SUBJECT_VH_CM_INITIAL: sub.Subject_VH_CM_Initial,
												SUBJECT_VH_EX_INITIAL: sub.Subject_VH_EX_Initial,
												SUBJECT_VH_TD_INITIAL: sub.Subject_VH_TD_Initial,
												SUBJECT_VH_MT_INITIAL: sub.Subject_VH_MT_Initial,
												SUBJECT_VH_TP_INITIAL: sub.Subject_VH_TP_Initial,
												RECURENCE: 0
											};
										}));
										fileContents.push(cls.CLASS_ID);
										success = true;
									} catch (e) {
										console.log("Error when using inserting list of subjects of class", cls.CLASS_ID);
										console.log(e.message);
									}
								else {
									fileContents.push(cls.CLASS_ID);
									success = true;
								}
								if (fileContents.length % 50 === 0)
									fs.writeFileSync(filePath, JSON.stringify(fileContents), "utf8");
								console.log(`[${classes.indexOf(cls) + 1}/${classes.length}] - `, cls.CLASS_ID, "fetch", object.data.length, "row(s)", retry, "Retries");
							} else
								console.log("Error connection to academy");
						} catch (e) {
							if (retry === process.env.MAX_ACADEMY_RETRY) {
								fs.writeFileSync(filePath, JSON.stringify(fileContents), "utf8");
								console.log("Error went trying to fetch subjects for class", cls.CLASS_ID);
							}
						}
						retry++;
					} while (!success && retry <= process.env.MAX_ACADEMY_RETRY);
				}
				fs.writeFileSync(filePath, JSON.stringify(fileContents), "utf8");
				console.log("Stopping importation of subjects list\n");
			},
			runOnInit: function() {
				console.log("Services cron on for classes importations");
			},
			timeZone: process.env.timeZone
		},
		{
			name: "imp_student_subjects",
			cronTime: process.env.imp_student_subjects,

			onTick: async function() {

				let filePath = path.join(__dirname, "log", "imported", "student_subjects.json");
				let fileContents = [];

				if (fs.existsSync(filePath))
					fileContents = JSON.parse(fs.readFileSync(filePath, "utf8"));
				else fs.writeFileSync(filePath, JSON.stringify([]), "utf8");


				console.log("\nStarting importation of students subjects list");

				let StudentSubject = await this.call("studentSubjects.model");
				let Student = await this.call("students.model");

				let students = JSON.parse(JSON.stringify(await Student.findAll()));
				for (const student of students.filter(stu => !fileContents.includes(stu.STUDENT_ID))) {
					let retry = 0;
					let success = false;
					do {
						try {
							let url = `${process.env.academy}api/student/v1/SUJECTS?ApiKey=${process.env.apiKey}&RegistrationID=${student.REGISTRATION_ID}`;
							let object = await axios.get(url, { httpsAgent });
							let objects = object.data;
							if (object.status === 200) {
								let oldStudentsList = JSON.parse(JSON.stringify(await StudentSubject.findAll()));
								let newToAdd = objects?.filter(e => !oldStudentsList.find(e2 => e2.STUDENT_ID === student.STUDENT_ID && e.Subject_ID === e2.SUBJECT_ID));
								if (newToAdd.length > 0)
									try {
										await StudentSubject.bulkCreate(newToAdd.map(elt => ({
											STUDENT_ID: student.STUDENT_ID,
											SUBJECT_ID: elt.Subject_ID,
											CLASS_ID: elt.Class_ID
										})));
										fileContents.push(student.STUDENT_ID);
										success = true;
									} catch (e) {
										console.log("Error when using inserting list of subjects of student", student.STUDENT_ID);
										console.log(e.message);
									}
								else {
									success = true;
									fileContents.push(cls.CLASS_ID);
								}
								if (fileContents.length % 50 === 0)
									fs.writeFileSync(filePath, JSON.stringify(fileContents), "utf8");
								console.log(`[${students.indexOf(student) + 1}/${students.length}] - `, student.STUDENT_ID, "fetch", object.data.length, "row(s)", retry, "Retries");
							} else {
								console.log("Error connection to academy");
							}
						} catch (e) {
							if (retry === process.env.MAX_ACADEMY_RETRY) {
								fs.writeFileSync(filePath, JSON.stringify(fileContents), "utf8");
								console.log("Error went trying to fetch subjects for student", student.STUDENT_ID);
							}
						}
						retry++;
					} while (!success && retry <= process.env.MAX_ACADEMY_RETRY);
				}
				fs.writeFileSync(filePath, JSON.stringify(fileContents), "utf8");
				console.log("Stopping importation of subjects list\n");
			}, runOnInit: function() {
				console.log("Services cron on for employees importations");
			}
			, timeZone: process.env.timeZone
		},
		{
			name: "imp_employees",
			cronTime: process.env.imp_employees,
			onTick: async function() {
				try {
					console.log("\nStarting importation of employees list");
					let Employees = await this.call("employees.model");
					let url = `${process.env.academy}api/teacher/v1/LIST?ApiKey=${process.env.apiKey}&SchoolID=${process.env.school}&Year=${process.env.year}`;
					let object = await axios.get(url, { httpsAgent });
					if (object.status === 200) {
						let objects = object.data;
						let oldEmployeesList = await Employees.findAll();
						oldEmployeesList = JSON.parse(JSON.stringify(oldEmployeesList));
						let notInsertedList = _.uniqBy(objects, "Teacher_ID")?.filter(e => !oldEmployeesList.find(e2 => e2.MATRICULE === e.Teacher_ID));
						await Employees.bulkCreate(notInsertedList.map(elt => {
							return {
								MATRICULE: elt.Teacher_ID,
								FIRSTNAME: elt.Teacher_First_Name,
								LASTNAME: elt.Teacher_Last_Name,
								GENDER: elt.Teacher_Gender,
								BIRTHDATE: elt.Teacher_Birth_Date,
								BIRTHPLACE: elt.Teacher_Birth_Place,
								EMAIL: elt.Teacher_Email,
								ACCESS_COURSES: true,
								EMAIL_VERIFIED: true,
								ACTIVATED: true
							};
						}));
						console.log("Stopping importation of employees list with", notInsertedList.length, "Row(s) inserted");
					} else {
						console.log("error connection to academy", err);
					}
				} catch (e) {
					console.log(e.message);
				}
			},
			runOnInit: function() {
				console.log("Services cron on for employees importations");
			},
			timeZone: process.env.timeZone
		},
		{
			name: "imp_employee_subjects",
			cronTime: process.env.imp_employee_subjects,
			onTick: async function() {
				let filePath = path.join(__dirname, "log", "imported", "employee_subjects.json");
				let fileContents = [];

				if (fs.existsSync(filePath))
					fileContents = JSON.parse(fs.readFileSync(filePath, "utf8"));
				else fs.writeFileSync(filePath, JSON.stringify([]), "utf8");


				let Employees = await this.call("employees.model");
				let EmployeeSubjects = await this.call("employeeSubjects.model");

				console.log("\nstarting importation of employee subjects list");

				let employeeSubjects = JSON.parse(JSON.stringify(await EmployeeSubjects.findAll()));
				let employees = JSON.parse(JSON.stringify((await Employees.findAll({ attributes: ["MATRICULE"] }))));

				console.log("\nfetching new data from employee subjects list");

				for (const emp of employees.filter(cl => !fileContents.includes(cl.STUDENT_ID))) {
					let retry = 0;
					let success = false;
					do {
						try {
							let url = `${process.env.academy}api/teacher/v1/SUBJECTS?ApiKey=${process.env.apiKey}&Year=${process.env.year}&SchoolID=${process.env.school}&TeacherId=${emp.MATRICULE}`;
							let object = await axios.get(url, { httpsAgent });
							if (object.status === 200) {
								let array = object.data;
								if (array?.length > 0) {
									try {
										await EmployeeSubjects.bulkCreate(_.uniqBy(array, item => (emp.MATRICULE + item.Subject_ID + item.Subject_Abreviation_Class + item.Year_Name + item.Class_ID)).filter(elt => !employeeSubjects.find(e => e.SUBJECT_ID === elt.Subject_ID && e.EMPLOYEE_ID === emp.MATRICULE && e.CLASS_ID === elt.Class_ID && e.YEAR_NAME === elt.Year_Name)).map((eSub) => {
											return {
												SUBJECT_ID: eSub.Subject_ID,
												EMPLOYEE_ID: emp.MATRICULE,
												SCHOOL_ID: eSub.School_ID,
												CLASS_ID: eSub.Class_ID,
												YEAR_NAME: eSub.Year_Name,
												YEAR_START: eSub.Year_Begin_Date,
												YEAR_END: eSub.Year_End_Date,
												YEAR_ID: process.env.year,
												LEVEL_ID: eSub.Level_ID,
												SUBJECT_STATUS: eSub.Subject_Status,
												SUBJECT_PERIOD_POSITION: eSub.Subject_Periode_Position,
												SUBJECT_ABREVIATION_CLASS: eSub.Subject_Abreviation_Class
											};
										}));
										fileContents.push(emp.MATRICULE);
										success = true;
									} catch (e) {
										console.log("Error when using inserting list of subjects of employee", emp.MATRICULE);
										console.log(e.message);
									}
								} else {
									fileContents.push(emp.MATRICULE);
									success = true;
								}
								if (fileContents.length % 50 === 0)
									fs.writeFileSync(filePath, JSON.stringify(fileContents), "utf8");
								console.log(`[${employees.indexOf(emp) + 1}/${employees.length}] - `, emp.MATRICULE, "fetch", object.data.length, "row(s)");
							} else
								console.log("error connection to academy");
						} catch (e) {
							if (retry === process.env.MAX_ACADEMY_RETRY) {
								fs.writeFileSync(filePath, JSON.stringify(fileContents), "utf8");
								console.log("Error went trying to fetch subjects for employee", emp.MATRICULE);
							}
						}
						retry++;
					} while (!success && retry <= process.env.MAX_ACADEMY_RETRY);
				}
				fs.writeFileSync(filePath, JSON.stringify(fileContents), "utf8");
				console.log("stopping importation of subjects list\n");
			},
			runOnInit: function() {
				console.log("Services cron on for classes importations");
			}
			,
			timeZone: process.env.timeZone
		},
		{
			name: "imp_years",
			cronTime: process.env.imp_years,
			onTick: async function() {

				console.log("\nStarting importation of academic year list");

				let AcademicYear = await this.call("academicYear.model");
				let url = `${process.env.academy}api/year/v1/LIST?ApiKey=${process.env.apiKey}&SchoolID=${process.env.school}`;
				let object = axios.get(url, { httpsAgent });
				if (object.status === 200) {
					let array = object.data;
					let academicYear = (await AcademicYear.findAll());
					academicYear = JSON.parse(JSON.stringify(academicYear));
					await AcademicYear.bulkCreate(array.filter(elt => !academicYear.find(e => e?.YEAR_ID === elt.Year_ID)).map(elt => {
						return {
							YEAR_ID: elt.Year_ID,
							YEAR_NAME: elt.Year_Name,
							COUNT_TOTAL_STUDENT: elt.Year_Count_Students_Total,
							COUNT_FEMALE_STUDENT: elt.Year_Count_Students_Female,
							COUNT_MALE_STUDENT: elt.Year_Count_Students_Male
						};
					}));
					console.log("Stopping importation of year list\n");
				} else
					console.log("error connection to academy");
			},
			runOnInit: function() {
				console.log("Services cron on for year importations");
			},
			timeZone: process.env.timeZone
		},
		{
			name: "imp_entrance",
			cronTime: "0 12 11 * * *" || process.env.imp_entrance,
			onTick: async function() {
				try {
					let retry = 0;
					let success = false;
					do {
						console.log("\nStarting importation of entrance list");
						let Entrance = await this.call("entrance.model");
						let url = `${process.env.academy}api/entrance/v1/LIST?ApiKey=${process.env.apiKey}&SchoolID=${process.env.school}&Year=${process.env.year}`;
						let object = await axios.get(url, { httpsAgent });
						if (object.status === 200) {
							let array = object.data;
							let entrances = (await Entrance.findAll());
							entrances = JSON.parse(JSON.stringify(entrances));
							await Entrance.bulkCreate(array.filter(elt => !entrances.find(e => e?.Entrance_ID === elt.Entrance_ID)));
							console.log(url);
							console.log("Stopping importation of year list\n");
						} else
							console.log("error connection to academy");
						retry++;
					} while (!success && retry <= process.env.MAX_ACADEMY_RETRY);
				} catch (e) {
					console.log(e.message);
				}
			},
			runOnInit: function() {
				console.log("Services cron on for year importations");
			},
			timeZone: process.env.timeZone
		},
		{
			name: "imp_speciality",
			cronTime: "0 1 18 * * *" || process.env.imp_speciality,
			onTick: async function() {
				try {
					let retry = 0;
					let success = false;
					do {
						console.log("\nStarting importation of speciality list");
						let Speciality = await this.call("speciality.model");
						let url = `${process.env.academy}api/speciality/v1/LIST?ApiKey=${process.env.apiKey}&SchoolID=${process.env.school}&Year=${process.env.year}`;
						console.log(url);
						let object = await axios.get(url, { httpsAgent });
						if (object.status === 200) {
							let array = object.data;
							let specialities = (await Speciality.findAll());
							specialities = JSON.parse(JSON.stringify(specialities));
							await Speciality.bulkCreate(array.filter(elt => !specialities.find(e => e?.Year_ID === elt.Year_ID)));
							console.log("Stopping importation of specialities list\n");
						} else {
							console.log(object);
							console.log("error connection to academy");
						}
						retry++;
					} while (!success && retry <= process.env.MAX_ACADEMY_RETRY);
				} catch (e) {
					console.log(e.message);
				}
			},
			runOnInit: function() {
				console.log("Services cron on for year importations");
			},
			timeZone: process.env.timeZone
		}
	],
	started() {
	}
};
