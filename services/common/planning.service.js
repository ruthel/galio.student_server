"use strict";

// const adapter = require("./../adapter/adapter");
// const DbService = require("moleculer-db");
const Class = require("../../models/common/Class");
const axios = require('axios');
const _ = require("lodash");

module.exports = {
  name: "plannings",

  // mixins: [DbService],
  // adapter,
  model: Class,

  actions: {
    find: {
      async handler(ctx) {
        try {
          let query = `${process.env.academy}api/teacher/v1/LESSONS?ApiKey=${process.env.apiKey}&SchoolID=IUC&TeacherID=${ctx.params.MATRICULE}&LessonStatus=0&BeginDate=${ctx.params.START_DATE}&EndDate=${ctx.params.END_DATE}`
          let result = await axios.get(query)
          let object = result.data

          if (object.length > 0) {
            object = object.map(elt => {
              delete elt.Teacher_Title
              delete elt.Teacher_ID
              delete elt.Teacher_Birth_Date
              delete elt.Teacher_Birth_Place
              delete elt.Teacher_Email
              delete elt.Teacher_First_Name
              delete elt.Teacher_Full_Name
              delete elt.Teacher_Gender
              delete elt.Teacher_Last_Name
              delete elt.Teacher_Phone
              delete elt.Bill_Period_Abreviation
              delete elt.Bill_Period_Begin_Date
              delete elt.Bill_Period_ID
              delete elt.Bill_Period_Name
              delete elt.Bill_Period_End_Date
              delete elt.Room_Capacity
              delete elt.School_Name
              delete elt.School_ID
              delete elt.Year_ID
              delete elt.Year_End_Date
              delete elt.Year_Begin_Date
              delete elt.Speciality_Description
              return {...elt}
            })
            return _.uniqBy(object,'Lesson_ID')
          } else
            ctx.meta.$statusCode = 204;
        } catch (e) {
          ctx.meta.$statusCode = 403;
          return e
        }
      }
    },
    model: {
      async handler() {
        return this.model
      }
    }
  },
}
