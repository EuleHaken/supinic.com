/* global sb */
module.exports = (function () {
	"use strict";

	const Express = require("express");
	const Router = Express.Router();

	const Channel = require("../../modules/chat-data/channel.js");

	const formatReminderList = async (req, res, target) => {
		const { userID } = await sb.WebUtils.getUserLevel(req, res);
		if (!userID) {
			return res.status(401).render("error", {
				error: "401 Unauthorized",
				message: "You must be logged in before viewing your reminders"
			});
		}

		const searchParams = sb.WebUtils.authenticateLocalRequest(userID, null);
		const { statusCode, body } = await sb.Got("Supinic", {
			url: `bot/reminder/${target}`,
			searchParams: searchParams.toString(),
			throwHttpErrors: false
		});

		if (statusCode !== 200) {
			return res.status(401).render("error", {
				error: "401 Unauthorized",
				message: "You must be logged in before viewing your reminders"
			});
		}

		const user = res.locals.authUser.login.toLowerCase();
		const sortedData = body.data.sort((a, b) => b.ID - a.ID);

		const data = sortedData.map(i => {
			if (i.author.toLowerCase() === user) {
				i.author = "(You)";
			}
			if (i.target.toLowerCase() === user) {
				i.target = "(You)";
			}

			const schedule = (i.schedule) ? new sb.Date(i.schedule) : null;
			const obj = {
				Created: new sb.Date(i.created).format("Y-m-d"),
				Sender: i.author,
				Recipient: i.target,
				Text: i.text,
				Scheduled: {
					dataOrder: (schedule) ? schedule.valueOf() : 0,
					value: (schedule)
						? `<div class="hoverable" title="UTC: ${schedule.toUTCString()}">${sb.Utils.timeDelta(schedule)}</div>`
						: "N/A",
				},
				ID: `<a target="_blank" href="/bot/reminder/${i.ID}">${i.ID}</a>`
			};

			return obj;
		});

		const titleType = (target === "history") ? "historical (inactive)" : "active";
		return res.render("generic-list-table", {
			data,
			title: `Reminder list - ${titleType}`,
			head: ["Created", "Sender", "Recipient", "Text", "Scheduled", "ID"],
			pageLength: 25,
			sortColumn: 0,
			sortDirection: "desc",
			specificFiltering: true,
			extraCSS: `
				div.hoverable {
					text-decoration: underline dotted;
				}
			`
		});
	};

	Router.get("/list", async (req, res) => {
		return await formatReminderList(req, res, "list");
	});

	Router.get("/history", async (req, res) => {
		return await formatReminderList(req, res, "history");
	});

	Router.get("/:id", async (req, res) => {
		const { userID } = await sb.WebUtils.getUserLevel(req, res);
		if (!userID) {
			return res.status(401).render("error", {
				error: "401 Unauthorized",
				message: "You must be logged in before viewing your reminders"
			});
		}

		const ID = Number(req.params.id);
		if (!sb.Utils.isValidInteger(ID)) {
			return res.status(400).render("error", {
				error: sb.WebUtils.formatErrorMessage(400),
				message: "Malformed reminder ID"
			});
		}

		const searchParams = sb.WebUtils.authenticateLocalRequest(userID, null);
		const { statusCode, body } = await sb.Got("Supinic", {
			url: `bot/reminder/${ID}`,
			searchParams: searchParams.toString()
		});

		if (statusCode !== 200) {
			return res.status(statusCode).render("error", {
				error: sb.WebUtils.formatErrorMessage(statusCode),
				message: body.error.message
			});
		}

		const rawData = body.data;
		const { userData } = res.locals.authUser;
		if (rawData.User_To !== userData.ID && rawData.User_From !== userData.ID) {
			return res.status(403).render("error", {
				error: sb.WebUtils.formatErrorMessage(403),
				message: "This reminder was not created by you or for you"
			});
		}

		const senderUserData = (rawData.User_From === userData.ID)
			? userData
			: await sb.User.get(rawData.User_From);

		const recipientUserData = (rawData.User_To === userData.ID)
			? userData
			: await sb.User.get(rawData.User_To);

		const data = {
			ID: rawData.ID,
			Sender: senderUserData.Name,
			Recipient: recipientUserData.Name,
			"Created in channel": (rawData.Channel)
				? (await Channel.getRow(rawData.Channel)).values.Name
				: "(created in PMs)",
			Text: rawData.Text,
			Pending: (rawData.Active) ? "yes" : "no",
			Created: rawData.Created.format("Y-m-d H:i:s"),
			Scheduled: (rawData.Schedule)
				? rawData.Schedule.format("Y-m-d H:i:s")
				: "(not scheduled)",
			Private: (rawData.Private_Message) ? "yes" : "no"
		};

		res.render("generic-detail-table", { data });
	});

	return Router;
})();
