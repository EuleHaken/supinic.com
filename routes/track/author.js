module.exports = (function () {
	"use strict";

	const Express = require("express");
	const Router = Express.Router();

	Router.get("/list", async (req, res) => {
		const { data } = await sb.Got("Supinic", "track/author/list").json();
		const printData = data.map(row => {
			return {
				Name: row.name,
				Aliases: (row.aliases.length > 0)
					? row.aliases.join(", ")
					: "N/A",
				ID: `<a target="_blank" href="/track/author/${row.ID}">${row.ID}</a>`
			};
		});

		res.render("generic-list-table", {
			data: printData,
			head: Object.keys(printData[0]),
			pageLength: 25
		});
	});

	Router.get("/:id", async (req, res) => {
		const authorID = Number(req.params.id);
		if (!sb.Utils.isValidInteger(authorID)) {
			return res.status(404).render("error", {
				error: "404 Not Found",
				message: "Invalid ID"
			});
		}

		const { data } = await sb.Got("Supinic", "track/author/" + authorID).json();
		const contactData = data.contacts.map(i => (
			`<li>${i.website}: <a target="_blank" rel="noopener noreferrer" href="${i.link}">${i.name}</a></li>`
		));

		const printData = {
			Name: data.name,
			"Also known as": (data.aliases.length > 0)
				? data.aliases.join("<br>")
				: "N/A",
			Country: (data.country) ?? "N/A",
			Contacts: (contactData.length > 0)
				? `<ul>${contactData.join("")}</ul>`
				: "N/A",
			Notes: data.notes ?? "N/A",
			Tracks: [
				"<table id='authorTracks'>",
				"<thead><tr><th>Track</th><th>Role</th><th>Published</th></tr></thead>",
				data.tracks
					.sort((a, b) => a.name.localeCompare(b.name))
					.map(i => [
						"<tr>",
						`<td><a target="_blank" href="/track/detail/${i.ID}">${i.name}</a></td>`,
						`<td>${i.role}</td>`,
						`<td>${(i.published) ? new sb.Date(i.published).sqlDate() : "N/A"}</td>`,
						"</tr>"
					].join(""))
					.join(""),
				"</table>"
			].join("")
		};

		res.render("author", {
			data: printData
		});
	});

	return Router;
})();