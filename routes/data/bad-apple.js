module.exports = (function () {
	"use strict";

	const Express = require("express");
	const Router = Express.Router();

	Router.get("/list", async (req, res) => {
		const { data } = await sb.Got("Supinic", "/data/bad-apple/list").json();
		const renderData = data.map(i => {
			const notesString = (i.notes) ? " 📝" : "";
			const detailLink = `<a href="/data/bad-apple/${i.ID}">${i.ID}${notesString}</a>`;
			const deviceLink = (i.device && i.link)
				? `<a href="${i.link}">${i.device}</a>`
				: (i.device)
					? i.device
					: "N/A"

			return {
				Device: deviceLink,
				Type: i.type ?? "N/A",
				Published: (i.published)
					? new sb.Date(i.published).format("Y-m-d")
					: "N/A",
				"↔": {
					value: i.width ?? "X",
					dataOrder: i.width ?? 0
				},
				"↕": {
					value: i.height ?? "X",
					dataOrder: i.height ?? 0
				},
				FPS: {
					value: i.fps ?? "N/A",
					dataOrder: i.fps ?? 0
				},
				ID: detailLink
			};
		});

		res.render("generic-list-table", {
			title: "Bad Apple renditions",
			data: renderData,
			head: Object.keys(renderData[0]),
			pageLength: 50,
			sortColumn: 0,
			sortDirection: "asc"
		});
	});

	Router.get("/:id", async (req, res) => {
		const { statusCode, body } = await sb.Got("Supinic", "/data/bad-apple/" + req.params.id);
		if (statusCode !== 200) {
			return res.status(statusCode).render("error", {
				error: sb.WebUtils.formatErrorMessage(statusCode),
				message: body.error.message
			});
		}

		const detail = body.data;
		const data = {
			ID: detail.ID,
			Device: detail.device,
			Link: `<a href="${detail.link}">${detail.link}</a>`,
			Type: detail.type ?? "N/A",
			Published: (detail.published)
				? new sb.Date(detail.published).format("Y-m-d")
				: "N/A",
			Height: detail.height ?? "N/A",
			Width: detail.width ?? "N/A",
			FPS: detail.fps ?? "N/A",
			Notes: detail.notes ?? "N/A"
		};

		res.render("generic-detail-table", {
			title: `${detail.ID} Bad Apple! on ${detail.device}`,
			data
		});
	});

	return Router;
})();