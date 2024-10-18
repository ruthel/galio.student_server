"use strict";
const fs = require("fs");

module.exports = {
  name: "uploads",
  actions: {

    getFile: {
      params: {
        matricule: {type: "string"},
        file: {type: "string"}
      },
      async handler(ctx) {
        let result = fs.readFileSync(`upload/${ctx.params.matricule}/${ctx.params.file}`)
        if (!result) {
          ctx.meta.$statusCode = 400
          return {message: 'no such file existing'}
        }
        return result
      }
    },
  },
}
