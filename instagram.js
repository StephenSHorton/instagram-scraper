const puppeteer = require("puppeteer");
const fs = require("fs");
const { debug } = require("console");

const BASE_URL = "https://instagram.com/";

const getPaginatedItems = async (ig, limit) => {
	let items = [];
	while (items.length < limit) {
		items = await ig.page.evaluate(async () => {
			const extractedElements = await ig.page.$x(
				"//html/body/div[5]/div/div/div[2]/ul/div/li"
			);
			const _items = [];
			for (let element of extractedElements) {
				const nameDiv = await element.$x("//div/div[1]/div[2]/div[2]")
					.innerText;
				_items.push(nameDiv.innerText);
			}
			return _items;
		});
		const height = await ig.page.evaluate(
			`document.querySelector("${scrollableSectionSelector}").scrollHeight`
		);
		await ig.page.evaluate(
			`document.querySelector("${scrollableSectionSelector}").scrollTop = ${height}`
		);
		await ig.page.waitForTimeout(scrollDelay);
	}
	return items;
};

const extractItems = () => {
	const extractedElements = document.querySelectorAll("#boxes > div.box");
	const items = [];
	for (let element of extractedElements) {
		items.push(element.innerText);
	}
	return items;
};

const scrapeInfiniteScrollItems = async (
	page,
	extractItems,
	itemTargetCount,
	scrollableSectionSelector,
	scrollDelay = 1000
) => {
	let items = [];
	try {
		let previousHeight;
		while (items.length < itemTargetCount) {
			items = await page.evaluate(extractItems);
			previousHeight = await ig.page.evaluate(
				`document.querySelector("${scrollableSectionSelector}").scrollHeight`
			);
			await ig.page.evaluate(
				`document.querySelector("${scrollableSectionSelector}").scrollTop = ${previousHeight}`
			);
			await page.waitForTimeout(scrollDelay);
		}
	} catch (e) {}
	return items;
};

const instagram = {
	browser: null,
	page: null,

	initialize: async () => {
		instagram.browser = await puppeteer.launch({
			headless: false,
			// devtools: true,
		});

		instagram.page = await instagram.browser.newPage();
	},

	login: async (username, password) => {
		//Wait for page to load
		await instagram.page.goto(BASE_URL, { waitUntil: "networkidle2" });

		//Type username and password
		await instagram.page.type("input[name=username]", username, {
			delay: 50,
		});
		await instagram.page.type("input[name=password]", password, {
			delay: 50,
		});

		//Click on the login button
		const loginButton = await instagram.page.waitForSelector(
			"#loginForm > div > div:nth-child(3) > button"
		);
		await loginButton.click();
		await instagram.page.waitForNavigation();

		//Click don't save login info
		const notNowButton = await instagram.page.waitForSelector(
			"#react-root > section > main > div > div > div > div > button"
		);
		await notNowButton.click();
		await instagram.page.waitForNavigation();
	},

	navigateToProfile: async () => {
		//Click not now to keep notifications off
		const notNowButton2 = await instagram.page.waitForSelector(
			"body > div.RnEpo.Yx5HN > div > div > div > div.mt3GC > button.aOOlW.HoLwm"
		);
		await notNowButton2.click();

		//Click on profile image
		const profileImgButton = await instagram.page.waitForSelector(
			"#react-root > section > nav > div._8MQSO.Cx7Bp > div > div > div.ctQZg > div > div:nth-child(5) > span > img"
		);
		profileImgButton.click();

		//Click on profile link
		const profileLink = await instagram.page.waitForSelector(
			"#react-root > section > nav > div._8MQSO.Cx7Bp > div > div > div.ctQZg > div > div:nth-child(5) > div.poA5q > div.uo5MA._2ciX.tWgj8.XWrBI > div._01UL2 > a:nth-child(1)"
		);
		profileLink.click();
		await instagram.page.waitForNavigation();
	},

	getFollowerInformation: async () => {
		//Get total followers
		const followersTotalSelector =
			"#react-root > section > main > div > header > section > ul > li:nth-child(2) > a > span";
		await instagram.page.waitForSelector(
			//Wait for selector to load
			followersTotalSelector
		);
		const totalFollowers = await instagram.page.$eval(
			followersTotalSelector,
			(el) => Number(el.innerText)
		);

		//Click on followers
		const followersLink = await instagram.page.waitForSelector(
			"#react-root > section > main > div > header > section > ul > li:nth-child(2) > a"
		);
		await followersLink.click();

		//Scroll and extract items from the page
		const scrollableSectionSelector =
			"body > div.RnEpo.Yx5HN > div > div > div.isgrP";
		await instagram.page.waitForSelector(
			//Wait for selector to load
			scrollableSectionSelector
		);

		let previousHeight = 0;
		let newHeight;
		while (previousHeight !== newHeight) {
			previousHeight = await instagram.page.evaluate(
				`document.querySelector("${scrollableSectionSelector}").scrollHeight`
			);
			await instagram.page.evaluate(
				`document.querySelector("${scrollableSectionSelector}").scrollTop = ${previousHeight}`
			);
			await instagram.page.waitForTimeout(500);
			newHeight = await instagram.page.evaluate(
				`document.querySelector("${scrollableSectionSelector}").scrollHeight`
			);
		}

		const extractedElements = await instagram.page.$x(
			//Followers
			"//html/body/div[5]/div/div/div[2]/ul/div/li"
		);
		const items = [];
		for (let elementHandle of extractedElements) {
			//First name last name
			const name = await elementHandle.$eval(
				"div > div:nth-child(1) > div:nth-child(2) > div:nth-child(1)> span > a",
				(node) => node.innerText
			);

			await elementHandle.hover();
			await instagram.page.waitForTimeout(2000);

			const fCount = await instagram.page.evaluate(
				`document.querySelector("body > div.GdeD6.AzWhO > div > div > div:nth-child(2) > div > div > div:nth-child(2) > span > span").innerHtml`
			);

			items.push({ name, fCount });
		}
		debugger;

		// const items = getPaginatedItems(instagram, totalFollowers);

		// // Save extracted items to a file.
		// fs.writeFileSync("./items.txt", items.join("\n") + "\n");

		// // Close the browser.
		// await instagram.browser.close();
	},
};

module.exports = instagram;
