"use strict";

const adapter = require("../../adapter/mssql");
const DbService = require("moleculer-db");
const RequestStep = require("../../models/request/RequestStep");
const _ = require("lodash");
const {Sequelize, Op} = require("sequelize");
const {closedRequest} = require("../../helpers/mail");

module.exports = {
  name: "requestsSteps",

  mixins: [DbService],
  adapter,
  model: RequestStep,

  actions: {
    getCommentRequest: {
      params: {
        id: {type: "string"},
      },
      async handler(ctx) {
        try {

          let RequestStepConfig = await this.broker.call('requestStepConfigs.model')
          let LabelDecision = await this.broker.call('labelDecisions.model')

          try {
            this.adapter.model.belongsTo(RequestStepConfig, {
              foreignKey: 'RSTEPCONFIG_ID',
              targetKey: 'RSTEP_ID',
              as: 'RequestStepConfig'
            })
          } catch (e) {
          }

          try {
            this.adapter.model.belongsTo(LabelDecision, {
              foreignKey: 'RSTEP_DECISION',
              targetKey: 'id',
              as: 'LabelDecision'
            })
          } catch (e) {
          }

          let result = await this.adapter.model.findAll({
            include: [
              {model: RequestStepConfig, as: 'RequestStepConfig'},
              {model: LabelDecision, as: 'LabelDecision', attributes: ['LIBELLE']}
            ],
            where: {
              REQUEST_ID: ctx.params.id,
            },
            attributes: ['id', 'RSTEP_COMM', 'createdAt']
          })

          if (!result)
            ctx.meta.$statusCode = 204;
          return result

        } catch (e) {
          console.log(e)
          ctx.meta.$statusCode = 500;
        }
      }
    },
    getRequestStepsById: {
      params: {
        id: {type: "string"},
      },
      async handler(ctx) {
        try {

          let result = await this.adapter.model.findAll({where: {id: ctx.params.id}})

          if (!result)
            ctx.meta.$statusCode = 204;
          return result

        } catch (e) {
          console.log(e)
          ctx.meta.$statusCode = 500;
        }
      }
    },
    getRequestLastStepForBatches: {
      params: {
        RSTEPCONFIG_ID: {type: "string"},
        RSTEP_DEST_ID: {type: "string"},
      },
      async handler(ctx) {
        try {

          let RequestStepConfig = await this.broker.call('requestStepConfigs.model')
          let config = await RequestStepConfig.findAll({
            where: {
              RSTEP_DEST_ID: ctx.params.RSTEP_DEST_ID,
              RSTEP_UNITY_ID: ctx.params.RSTEPCONFIG_ID
            }
          })

          console.log(ctx.params)

          config = JSON.parse(JSON.stringify(config))

          let result = await this.adapter.db.query(`
              SELECT r1.id,
                     r1.REQUEST_ID,
                     r2.RSTEP_DEST_ID,
                     r.REQUEST_AUTHOR,
                     c.S_CATEGORIE as REQUEST_CATEGORY_ID,
                     r.REQUEST_OBJECT,
                     e.LASTNAME,
                     e.FIRSTNAME
              FROM REQUEST_STEPS r1
                       JOIN REQUESTS r ON r.REQUEST_ID = r1.REQUEST_ID
                       JOIN REQUEST_STEPS rs ON (r.REQUEST_ID = rs.REQUEST_ID)
                       JOIN EMPLOYEES e ON e.MATRICULE = r.REQUEST_AUTHOR
                       JOIN REQUESTS_CATEGORIES c ON c.ID_SCAT = r.REQUEST_CATEGORY_ID
                       JOIN REQUEST_STEP_CONFIGS r2 ON r2.RSTEP_ID = r1.RSTEPCONFIG_ID
              WHERE r.REQUEST_UNITY_ID ${ctx.params.RSTEP_DEST_ID === 'ADM' ? "like '%%'" : `in (${config.map(c => "\'" + c.RSTEP_UNITY_ID + "\'")})`}
                AND r.REQUEST_UNITY_TRANSMISSIBLE = 1
                AND r2.RSTEP_DEST_ID = '${ctx.params.RSTEP_DEST_ID}'
                AND r.PRINTED = 1
          `)

          result = _.uniqBy(result[0], 'REQUEST_ID')
          if (!result || result.length === 0)
            ctx.meta.$statusCode = 204;
          return result

        } catch (e) {
          console.log(e)
          ctx.meta.$statusCode = 500;
        }
      }
    },
    getRequestStepByIds: {
      async handler(ctx) {
        try {

          let RequestStepConfig = await this.broker.call('requestStepConfigs.model')

          try {
            this.adapter.model.belongsTo(RequestStepConfig, {
              foreignKey: 'RSTEPCONFIG_ID',
              targetKey: 'RSTEP_ID',
              as: 'RequestStepConfig'
            })
          } catch (e) {

          }

          let result = await this.adapter.model.findAll({
            include: [{model: RequestStepConfig, as: 'RequestStepConfig'}],
            where: {
              REQUEST_ID: {
                [Op.in]: ctx.params.ids
              }
            },
            attributes: ['id', 'REQUEST_ID']
          })

          result = JSON.parse(JSON.stringify(result))
          if (!result)
            ctx.meta.$statusCode = 204;
          return result

        } catch (e) {
          console.log(e)
          ctx.meta.$statusCode = 500;
        }
      }
    },
    createRequestStep: {
      async handler(ctx) {
        try {

          let data = ctx.params
          let Request = await this.broker.call('requests.model')
          let Employee = await this.broker.call('employees.model')
          let LabelDecisions = await this.broker.call('labelDecisions.model')
          let RequestStatus = await this.broker.call('requestStatus.model')


          let request = await Request.findOne({
            where: {REQUEST_ID: data.REQUEST_ID},
            attributes: ['REQUEST_AUTHOR', 'REQUEST_ID']
          })

          request = JSON.parse(JSON.stringify(request))

          let employee = await Employee.findOne({where: {MATRICULE: request.REQUEST_AUTHOR}})
          employee = JSON.parse(JSON.stringify(employee))

          let decision = await LabelDecisions.findOne({where: {id: parseInt(data.RSTEP_DECISION)}})
          decision = JSON.parse(JSON.stringify(decision))


          let status = await RequestStatus.findOne({where: {REQ_STATUS_ID: decision.REQ_STATUS_ID}})
          status = JSON.parse(JSON.stringify(status))
          let r = await RequestStatus.findAll();

          console.log(decision)

          let result = await this.adapter.db.query(`
          [dbo].[INSERTION_REQUEST_STEP]
            @REQUEST_ID="${data.REQUEST_ID || ''}",
            @RSTEPCONFIG_ID="${data.RSTEPCONFIG_ID || ' '}",
            @RSTEP_DECISION="${data.RSTEP_DECISION || ' '}",
            @RSTEP_COMM="${data.RSTEP_COMM || ' '}",
            @RSTEP_TIME="${data.RSTEP_TIME || ' '}",
            @RSTEP_STATUS="${status?.REQ_STATUS_LABEL || ' '}",
            @createdAt="${(new Date().toISOString()).split('T')[0]}",
            @updatedat="${(new Date().toISOString()).split('T')[0]}"
        `)


          if (status.REQ_STATUS_LABEL === 'VALIDATED' || status.REQ_STATUS_LABEL === 'REJECTED')
            closedRequest(request, employee).then()

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
