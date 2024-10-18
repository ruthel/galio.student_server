"use strict";
const Entrance = require("../../models/common/Entrance");
const DbService = require("moleculer-db");
const adapter = require("../../adapter/mssql");
const {Op} = require("sequelize");

module.exports = {
	name: "entrance",
	mixins: [DbService],
	adapter,
	model: Entrance,
	actions: {
		model: {
			async handler() {
				return this.model
			}
		},
		listAll: {
			async handler() {
				return this.adapter.find({
					where: {
						Year_ID: `IUC$${process.env.year}`,
						Entrance_Registration_Limit_Date: {
							[Op.gte]: new Date()
						}
					},
					order: [
						['Level_ID', 'ASC'],
					],
				})
			}
		},
	},

	async started() {
		await this.adapter.model.sync({force: false})
	},

	stopped() {
	}
};
