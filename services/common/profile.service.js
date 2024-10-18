"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const Profile = require("../../models/common/Profile");
const axios = require('axios');
const {decrypt, encrypt} = require("../../helpers/cryptogram");

module.exports = {
  name: "profiles",

  mixins: [DbService],
  adapter,
  model: Profile,

  actions: {
    deleteProfile: {
      params: {
        elt: {type: 'string'}
      },
      async handler(ctx) {
        try {
          const result = await this.adapter.model.destroy({
            where: {
              PROFILNAME: ctx.params.elt
            }
          });

          if (result) {
            return result
          } else
            ctx.meta.$statusCode = 400;
        } catch (e) {
          console.log(e)
          ctx.meta.$statusCode = 500;
        }
      }
    },
    getProfiles: {
      async handler(ctx) {
        try {

          let result = await this.adapter.model.findAll();
          result = JSON.parse(JSON.stringify(result))

          if (result) {
            return result.map(e => {
              return {
                ...e,
                PRIVILEGE: decrypt({iv: e.PRIVILEGE.split('@')[0], content: e.PRIVILEGE.split('@')[1]})
              }
            })
          } else {
            ctx.meta.$statusCode = 400;
            return {message: "Bad request !"}
          }

        } catch (e) {
          console.log(e)
          ctx.meta.$statusCode = 500;
        }
      }
    },
    addProfile: {
      async handler(ctx) {
        try {

          let data = ctx.params
          const hash = encrypt(data.privilege.join('-'));

          const result = await this.adapter.model.create({
            PROFILNAME: data.role,
            PRIVILEGE: hash.iv + '@' + hash.content,
            PROFILEID: data.id
          });

          if (result) {
            ctx.meta.$statusCode = 201;
            return result
          } else
            ctx.meta.$statusCode = 400;

        } catch (e) {
          console.log(e)
          ctx.meta.$statusCode = 500;
        }
      }
    },
    updateProfile: {
      async handler(ctx) {
        try {

          let data = ctx.params
          const hash = encrypt(data.privilege.join('-'));
          const result = await this.adapter.model.update({
            PROFILNAME: data.role,
            PRIVILEGE: hash.iv + '@' + hash.content
          }, {
            where: {
              id: data.id
            }
          });

          if (result) {
            ctx.meta.$statusCode = 200;
            return result
          } else
            ctx.meta.$statusCode = 400;

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
