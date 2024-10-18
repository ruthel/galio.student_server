"use strict";
const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
	name: "cmd",
	actions: {
		runner: {
			async handler() {
				const envFilePath = path.join(__dirname, "..", "..", ".env");
				const envContent = fs.readFileSync(envFilePath, "utf8");
				const envVariables = envContent
					.split("\n")
					.filter(line => line.trim() !== "")
					.reduce((acc, line) => {
						const [key, value] = line.split("=");
						acc[key] = value;
						return acc;
					}, {});
				envVariables.MY_API_KEY = "new-value";
				const updatedEnvContent = Object.entries(envVariables)
					.map(([key, value]) => `${key}=${value}`)
					.join("\n");
				fs.writeFileSync(envFilePath, updatedEnvContent, "utf8");
				console.log("Environment variable updated successfully!");
				const cronService = this.broker.getLocalService("imports");
				console.log(cronService.getJob("imp_classes"));
				// cronService.stop();
				// cronService.start();
			}
		},
		pictures: {
			async handler(ctx) {
				let Students = await ctx.call("students.model");
				let list = JSON.parse(JSON.stringify(await Students.findAll()));
				let download = async function(uri, filename, STUDENT_ID, callback) {
					let exist = fs.existsSync(`pictures/${STUDENT_ID}.png`);
					if (!exist) {
						let stream = (await axios.get(uri, { responseType: "stream" }));
						console.log(stream.data);
						await stream.data.pipe(fs.createWriteStream(filename)).on("close", callback);
					}
				};

				for (const stu of list) {
					// try {
					// 	let stat = fs.statSync(`pictures/${stu.STUDENT_ID}.png`);
					// 	if (stat.size === 19252) {
					// 		fs.rmSync(`pictures/${stu.STUDENT_ID}.png`);
					// 	}
					// } catch (e) {
					//
					// }
						await download(`https://igoserver.myiuc.com/media/picture/${stu.STUDENT_ID}`, `pictures/${stu.STUDENT_ID}.jpg`, stu.STUDENT_ID, function() {
							console.log("done");
						});
				}
			}
		}
	}
};
