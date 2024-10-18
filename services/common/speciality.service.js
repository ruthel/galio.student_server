"use strict";
const Speciality = require("../../models/common/Speciality");
const DbService = require("moleculer-db");
const adapter = require("../../adapter/mssql");

module.exports = {
	name: "speciality",
	mixins: [DbService],
	adapter,
	model: Speciality,
	actions: {
		model: {
			async handler() {
				return this.model
			}
		},
	},

	started() {},

	stopped() {}
};
