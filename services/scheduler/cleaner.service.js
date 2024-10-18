const Cron = require("moleculer-cron");
const _ = require("lodash");
const sequelize = require("sequelize");
const {Op, STRING, DATE, INTEGER} = require("sequelize");
const {birthdayEmail} = require("../../helpers/mail");
const axios = require("axios");
const fs = require("fs");


module.exports = {
  name: "imports", mixins: [Cron],
  crons: [
    // {
    //   name: "clean-class", cronTime: '0 0 18 * * *',
		//
    //   onTick: async function () {
		//
    //     console.log('\nstarting cleaning of employees list');
		//
    //     let Employees = await this.call('employees.model')
		//
    //     let allEmps = await Employees.findAll({raw: true})
    //     allEmps.forEach(emp => {
    //       let doublons = allEmps.filter(e => e.MATRICULE === emp.MATRICULE && e.id !== emp.id).map(e => e.id)
    //       if (doublons.length > 0) {
    //         console.log(doublons)
    //       }
    //     })
		//
    //     let badPhones = allEmps.filter(e => e.NUMPHONE?.length > 14 || e.NUMPHONE?.length <= 9).map(e => e.id)
    //     if (badPhones.length > 0) {
    //       console.log(badPhones)
    //       await Employees.update({NUMPHONE: null}, {where: {NUMPHONE: {[Op.in]: badPhones}}})
    //     }
		//
    //     let badPhones2 = allEmps.filter(e => e.NUMPHONE2?.length > 14 || e.NUMPHONE2?.length <= 9).map(e => e.id)
    //     if (badPhones2.length > 0)
    //       console.log(badPhones2)
		//
		//
    //   }, runOnInit: function () {
    //     console.log("Services cron on for employees importations");
		//
    //   }, timeZone: 'Africa/Douala'
    // },
    // {
    //   // name: "clean-employees", cronTime: '0 30 12 * * *',
    //   name: "clean-employees", cronTime: '0 0 20 * * *',
		//
    //   onTick: async function () {
		//
    //     console.log('\nstarting cleaning of employees list');
		//
    //     let Employees = await this.call('employees.model')
		//
    //     let allEmps = await Employees.findAll({raw: true})
		//
    //     let dir = fs.readdirSync(`upload`)
		//
    //     for (const emp of allEmps) {
    //       let doublons = allEmps.filter(e => e.MATRICULE === emp.MATRICULE && e.id !== emp.id).map(e => e.id)
    //       if (doublons.length > 0)
    //         await Employees.destroy({where: {id: {[Op.in]: doublons}}})
    //       if (!dir.includes(emp.MATRICULE))
    //         await Employees.update({
    //           NIU_LINK: null,
    //           CNPS_LINK: null,
    //           CV_LINK: null,
    //           IDENTITY1: null,
    //           IDENTITY2: null,
    //           RIB_LINK: null,
    //           IDENTITY1_PASSPORT: null,
    //           IDENTITY2_PASSPORT: null,
    //         }, {where: {MATRICULE: emp.MATRICULE}})
    //     }
		//
    //     let badPhones = allEmps.filter(e => e.NUMPHONE?.length > 14 || e.NUMPHONE?.length <= 9).map(e => e.id)
    //     if (badPhones.length > 0) {
    //       // console.log(badPhones)
    //       await Employees.update({NUMPHONE: null}, {where: {id: {[Op.in]: badPhones}}})
    //     }
		//
    //     let badPhones2 = allEmps.filter(e => e.NUMPHONE2?.length > 14 || e.NUMPHONE2?.length <= 9).map(e => e.id)
    //     if (badPhones2.length > 0) {
    //       // console.log(badPhones2)
    //       await Employees.update({NUMPHONE2: null}, {where: {id: {[Op.in]: badPhones2}}})
    //     }
		//
		//
    //   }, runOnInit: () => {
    //     console.log("Services cron on for employees importations");
    //   }, timeZone: 'Africa/Douala'
    // },
    // {
    //   name: "clean-employee-subjects",
    //   cronTime: '0 0 22 * * *',
    //   onTick: async function () {
		//
    //     try {
    //       let EmployeeSubjects = await this.call('employeeSubjects.model')
		//
    //       console.log('\nstarting cleaning of employee subjects list');
		//
    //       let employeeSubjects = (await EmployeeSubjects.findAll({attributes: ['id', 'EMPLOYEE_ID', 'SUBJECT_ID', 'CLASS_ID', 'YEAR_NAME']}))
    //       employeeSubjects = JSON.parse(JSON.stringify(employeeSubjects))
		//
    //       console.log('\nfetching new data from employee subjects list');
		//
    //       await EmployeeSubjects.destroy({
    //         where: {
    //           [Op.or]: {
    //             SUBJECT_ABREVIATION_CLASS: null,
    //             CLASS_ID: null
    //           }
    //         }
    //       })
		//
    //       for (let emp of _.uniqBy(employeeSubjects, item => item.EMPLOYEE_ID + item.SUBJECT_ID + item.CLASS_ID + item.YEAR_NAME)) {
    //         let count = await EmployeeSubjects.count({
    //           where: {
    //             EMPLOYEE_ID: emp.EMPLOYEE_ID,
    //             SUBJECT_ID: emp.SUBJECT_ID,
    //             YEAR_NAME: emp.YEAR_NAME,
    //             CLASS_ID: emp.CLASS_ID
    //           }
    //         })
    //         if (count > 1) {
    //           await EmployeeSubjects.destroy(
    //             {
    //               where: {
    //                 EMPLOYEE_ID: emp.EMPLOYEE_ID,
    //                 SUBJECT_ID: emp.SUBJECT_ID,
    //                 YEAR_NAME: emp.YEAR_NAME,
    //                 CLASS_ID: emp.CLASS_ID,
    //                 id: {[Op.not]: emp.id}
    //               }
    //             }
    //           )
    //         }
    //       }
    //     } catch (e) {
    //       console.log(e)
    //     }
    //   },
    //   runOnInit: function () {
    //     console.log("Services cron on for classes importations");
    //   }
    //   ,
    //   timeZone: 'Africa/Douala'
    // },
  ]
}
