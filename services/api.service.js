"use strict";

require('dotenv').config()
const ApiGateway = require("moleculer-web");
const {onBeforeCall} = require("../middlewares/auth.middleware");
const bodyParsers = require("../utilities/bodyParsers");

module.exports = {
	name: "api",
	mixins: [ApiGateway],

	// More info about settings: https://moleculer.services/docs/0.13/moleculer-web.html
	settings: {
		port: 3002,
		ip: '0.0.0.0',
		cors: true,
		callOptions: {
			retries: 3,
		},
		mappingPolicy: "restrict",
		routes: [
			{
				path: "/api",
				aliases: {
					// Upload group aliases
					"GET /student-verification": "student.verification",
					"GET /employees/list/all": "employees.apiAll",
					"GET /employees/update/cv/:MATRICULE": "employees.updateCV",
					"GET /runner": "cmd.runner",
					"GET /pictures": "cmd.pictures",
				},
				methods: ["GET"],
				bodyParsers,
				//onBeforeCall
			},
			{
				path: "/questions",
				aliases: {
					// Upload group aliases
					"GET /": "questions.add",
				},
				methods: ["GET"],
				bodyParsers,
				//onBeforeCall
			},
			{
				path: "/order-transaction",
				aliases: {
					// Upload group aliases
					"POST /": "orderTransaction.add",
				},
				methods: ["GET"],
				bodyParsers,
				//onBeforeCall
			},
			{
				path: "/entrances",
				aliases: {
					// Upload group aliases
					"GET /listall": "entrance.listAll",
				},
				methods: ["GET"],
				bodyParsers,
				//onBeforeCall
			},
			{
				path: "/candidate",
				aliases: {
					"POST /": "candidates.create",
					"POST /auth-email": "candidates.authEmail",
				},
				methods: ["GET"],
				// bodyParsers,
				// //onBeforeCall
			},
			{
				path: "/settings",
				aliases: {
					// Upload group aliases
					"POST /": "settings.set",
				},
				methods: ["POST"],
				bodyParsers,
				//onBeforeCall
			},
			{
				path: "/evaluation-sessions",
				aliases: {
					// Upload group aliases
					"POST /": "evaluationSessions.newSession",
					"GET /": "evaluationSessions.listSessions",
					"GET /delete/:id": "evaluationSessions.cancel",
					"PATCH /:EVALUATION_SESSION_ID": "evaluationSessions.changeStatus",
				},
				methods: ["POST", "GET"],
				bodyParsers,
				//onBeforeCall
			},
			{
				path: "/evaluation-forms",
				aliases: {
					// Upload group aliases
					"POST /": "evaluationForms.saveEvaluationForm",
					"PATCH /": "evaluationForms.updateEvaluationForm",
					"GET /": "evaluationForms.listForms",
					"GET /delete/:id": "evaluationForms.remove",
					"GET /duplicate/:id": "evaluationForms.duplicate",
					"GET /stats/:id": "evaluationForms.stats",
				},
				methods: ["POST", "GET", "PATCH"],
				bodyParsers,
				//onBeforeCall
			},
			{
				path: "/question-forms",
				aliases: {
					// Upload group aliase
					"GET /": "questionForms.loadAllQuestions",
					"GET /:form": "questionForms.loadQuestions",
					"GET /delete/:id": "questionForms.deleteQuestion",
					"POST /": "questionForms.newQuestion",
					"POST /submit": "questionForms.submit",
				},
				methods: ["POST", "GET", "PATCH"],
				bodyParsers,
				//onBeforeCall
			},
			{
				path: "/student-evaluation-sessions",
				aliases: {
					"PATCH /init/:STUDENT_ID": "studentEvaluationSessions.init",
				},
				methods: ["POST", "GET", "PATCH"],
				bodyParsers,
				// //onBeforeCall
			},
			{
				path: "/evaluations",
				aliases: {
					// Upload group aliases
					"GET /": "evaluations.listAll",
					"GET /stats": "evaluations.stats",
				},
				methods: ["POST", "GET"],
				bodyParsers,
				//onBeforeCall
			},
			{
				path: "/upload",
				aliases: {
					// Upload group aliases
					"GET :matricule/:file": "uploads.getFile",
				},
				methods: ["GET"],
				bodyParsers,
			},
			{
				path: "/classes",
				aliases: {
					// Classes group aliases
					"GET school": "classes.schoolList",
					"GET school/:id": "classes.classOfSchool",
					"GET affected/:school/:employee": "classes.classOfSchoolAffected",
					"GET school/affected/:employee": "classes.schoolListAffected",
					"GET /": "classes.findAll",
					"PATCH set-department": "classes.setClassDepartment",
				},
				methods: ["GET", "PATCH"],
				bodyParsers,
				//onBeforeCall
			},
			{
				path: "/organizations",
				aliases: {
					//Organizations Group aliases
					"GET /": "organizationGroups.find",
					"GET :filter": "organizationGroups.findOne",
					"GET delete/:organization": "organizationGroups.delete",
					"POST /": "organizationGroups.add",
					"PATCH /": "organizationGroups.updateOrganization",
				},
				methods: ["GET", "POST", "PATCH"],
				bodyParsers,
				//onBeforeCall
			},
			{
				path: "/identifications-types",
				aliases: {
					//Identifications Types Group aliases
					"GET /": "identificationTypes.find",
				},
				methods: ["GET"],
				bodyParsers,
				//onBeforeCall
			},
			{
				path: "/plannings",
				aliases: {
					//Plannings and fingerprint Group aliases
					"POST teacher/time-table": "plannings.find",
				},
				methods: ["POST"],
				bodyParsers,
				//onBeforeCall
			},
			{
				path: "/payments-modes",
				aliases: {
					//Payments modes Group aliases
					"GET /": "paymentModes.find",
				},
				bodyParsers,
				methods: ["GET"],
				//onBeforeCall
			},
			{
				path: "/request-categories",
				aliases: {
					//Request Category Group aliases
					"GET /": "requestsCategories.findCategories",
				},
				methods: ["GET"],
				bodyParsers,
				//onBeforeCall
			},
			{
				path: "/requests",
				aliases: {
					//Request Category Group aliases
					"GET :REQUEST_ID": "requests.getById",
					"GET user/:user": "requests.getRequestConcerned",
					"GET author/:matricule": "requests.getRequestConcernedAuthor",
					"GET stats/user/:matricule": "requests.getStatRequestForUser",
					"GET /": "requests.getRequest",
					"POST /": "requests.createRequest",
					"POST print": "requests.setPrinted",
					"POST report": "requests.getReport",
					"POST reject": "requests.rejectRequest",
				},
				methods: ["GET", "POST"],
				bodyParsers,
				//onBeforeCall
			},
			{
				path: "/request-steps-configs",
				aliases: {
					//Requests steps Category Group aliases
					"GET /": "requestStepConfigs.find",
					"POST users": "requestStepConfigs.findRequestStepUserConfig",
				},
				bodyParsers,
				methods: ["GET", "POST"],
				//onBeforeCall
			},
			{
				path: "/labels-decisions",
				aliases: {
					//Labels decisions Category Group aliases
					"POST /": "labelDecisions.getDecisions",
				},
				methods: ["POST"],
				bodyParsers,
				//onBeforeCall
			},
			{
				path: "/request-batches",
				aliases: {
					//Request batches Group aliases
					"GET :DEST_ID": "requestBatches.getBatches",
					"POST /transmit": "requestBatches.transmit",
					"GET /cancel/:id": "requestBatches.cancel",
					"PATCH /": "requestBatches.confirmBatchReception",
					"POST /": "requestBatches.createBatch"
				},
				methods: ["GET", "POST", "PATCH"],
				bodyParsers,
				//onBeforeCall
			},
			{
				path: "/documents",
				aliases: {
					//Documents Group aliases
					"GET /": "documents.gets",
					"GET :employee": "documents.getByEmployee",
					"POST delete": "documents.delete",
					"POST /": "documents.create",
				},
				methods: ["GET", "POST"],
				bodyParsers,
				//onBeforeCall
			},
			{
				path: "/profiles",
				aliases: {
					//Profiles Group aliases
					"GET delete/:elt": "profiles.deleteProfile",
					"GET /": "profiles.getProfiles",
					"POST update": "profiles.updateProfile",
					"POST /": "profiles.addProfile",
				},
				methods: ["GET", "POST"],
				bodyParsers,
				//onBeforeCall
			},
			{
				path: "/request-steps",
				aliases: {
					//Requests Steps Group aliases
					"GET comment/:id": "requestsSteps.getCommentRequest",
					"GET last-steps/:RSTEP_DEST_ID/:RSTEPCONFIG_ID": "requestsSteps.getRequestLastStepForBatches",
					"GET :id": "requestsSteps.getRequestStepsById",
					"POST routes": "requestsSteps.getRequestStepByIds",
					"POST /": "requestsSteps.createRequestStep",
				},
				methods: ["GET", "POST"],
				bodyParsers,
				//onBeforeCall
			},
			{
				path: "/students",
				aliases: {
					//Employee Group aliases
					"GET :id": "students.get",
					"GET /subjects/:MATRICULE": "students.listSubject",
					"GET import": "students.import",
					"GET /": "students.getEmployees",
					"POST valid-rh": "students.validationRh",
					"POST cv": "students.uploadCV",
					"POST close-sign": "students.closeSign",
					"POST gmail-account": "students.setGmailAccount",
					// "PATCH update/active": "students.setUserActive",
					// "PATCH update/diploma": "students.defineLastDocument",
					"PATCH update/:part": "students.updatePart",
					"PATCH files/remove": "students.removeFile",
					"POST contact-us": "students.contactUs",
					"POST contact-him": "students.contactHim",
				},
				methods: ["GET", "POST", "PATCH"],
				bodyParsers,
				//onBeforeCall
			},
			{
				path: "/users",
				aliases: {
					//Employee Group aliases
					"GET /": "users.gets",
					"GET :id": "users.getUser",
					"PATCH /": "users.update",
					"POST /create": "users.create",
				},
				methods: ["GET", "POST", "PATCH"],
				bodyParsers,
				//onBeforeCall
			},
			{
				path: "/auth",
				aliases: {
					//Authentication Group aliases
					"POST sign-in": "authenticators.loginStepForSendCode",
					"POST sign-up": "authenticators.signUp",
					"POST email-verification": "authenticators.verifyEmail",
					"POST email-confirmation": "authenticators.emailConfirmation",
					"POST code-verification": "authenticators.codeVerification",
					"POST /": "authenticators.login",
					"POST federate": "authenticators.signInWithFederate",
					"POST /students": "authenticators.loginStudents",
				},
				methods: ["POST"],
				bodyParsers
			},
			{
				path: "/applications-choices",
				aliases: {
					//Application choices Group aliases
					"GET clear/:application": "applicationChoices.clear",
					"POST predicated": "applicationChoices.predicateAffectation",
					"POST affect-to-class": "applicationChoices.affectTeacherToClass",
					"GET teachers/:subject/:session/:organisation": "applicationChoices.getTeachers",
					"GET older/:matricule": "applicationChoices.allOlder",
					"GET list-all": "applicationChoices.listAll",
					"GET :application/:organisation": "applicationChoices.gets",
					"POST /": "applicationChoices.createOrUpdate",
					"POST close": "applicationChoices.closeAffectations",
					"POST affect": "applicationChoices.affect",
					"POST by-class": "applicationChoices.byClass",
					"POST by-class-2": "applicationChoices.byClass2",
				},
				methods: ["GET", "POST"],
				bodyParsers,
				//onBeforeCall
			},
			{
				path: "/applications",
				aliases: {
					//Applications Group aliases
					"GET all/:employee": "applications.getAll",
					"GET close/:id": "applications.close",
					"GET current/:employee/:session_application_id": "applications.current",
					"GET session/filter/:id": "applications.getForSessionAffectionList",
					"GET session/:id": "applications.getForSession",
					"GET :employee": "applications.gets",
					"POST init": "applications.init",
					"POST /": "applications.create",
				},
				methods: ["GET", "POST"],
				bodyParsers,
				//onBeforeCall
			},
			{
				path: "/subjects",
				aliases: {
					//Subjects Group aliases
					"GET /": "subjects.findAll",
					"POST /": "subjects.getSubjectClass",
					"POST affected": "subjects.getSubjectClassAffected",
					"PATCH by-level/:page": "subjects.getByLevel",
				},
				methods: ["POST", "PATCH"],
				bodyParsers,
				//onBeforeCall
			},
			{
				path: "/employee-subjects",
				aliases: {
					//Subjects Group aliases
					"GET /": "employeeSubjects.getsdasdsa",
				},
				methods: ["GET"],
				bodyParsers,
				// //onBeforeCall
			},
			{
				path: "/sessions-applications",
				aliases: {
					//Sessions applications Group aliases
					"GET current": "sessionApplications.current",
					"GET close/:session": "sessionApplications.close",
					"GET /": "sessionApplications.gets",
					"POST activation": "sessionApplications.setActivated",
					"POST /": "sessionApplications.create",
				},
				methods: ["GET", "POST"],
				bodyParsers,
				//onBeforeCall
			},
			{
				path: "/request-groups",
				aliases: {
					//Request Groups Group aliases
					"GET /": "requestGroups.getRequestGroup",
					"PATCH /": "requestGroups.updateRequestGroup",
				},
				methods: ["GET", "PATCH"],
				bodyParsers,
				//onBeforeCall
			},
			{
				path: "/years",
				aliases: {
					"GET /": "academicYear.findAll",
				},
				methods: ["GET"],
				bodyParsers,
				//onBeforeCall
			}
		],
		// Serve assets from "public" folder
		assets: {
			folder: "upload",
		},
	},
};
