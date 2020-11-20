const puppeteer = require("puppeteer");
const fs = require("fs");
var log = require("single-line-log").stdout;
// let exPath = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";

const BASE_URL = "https://instagram.com/";

const instagram = {
	browser: null,
	page: null,

	initialize: async () => {
		console.log("Starting web-scrape...");
		instagram.browser = await puppeteer.launch({
			headless: false,
			// devtools: true,
		});

		instagram.page = await instagram.browser.newPage();
	},

	login: async (username, password) => {
		console.log("Logging in...");
		//Wait for page to load
		await instagram.page.goto(BASE_URL, { waitUntil: "networkidle2" });

		await instagram.page.waitForSelector("input[name=username]");
		await instagram.page.waitForSelector("input[name=password]");

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
		console.log("Navigating to profile...");
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
		console.log("Getting follower information...");
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
		console.log("Scrolling for follower state initialization...");
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

		const extractedDivTags = await instagram.page.$x(
			//Followers
			"//html/body/div[5]/div/div/div[2]/ul/div/li/div/div[1]/div[2]/div[2]"
		);
		const extractedATags = await instagram.page.$x(
			"//html/body/div[5]/div/div/div[2]/ul/div/li/div/div[1]/div[2]/div[1]/span/a"
		);
		// const items = [];
		for (let i = 0; i < extractedDivTags.length - 1; i++) {
			//First name last name
			const name = await instagram.page.evaluate(
				(el) => el.innerText,
				extractedDivTags[i]
			);
			const username = await instagram.page.evaluate(
				(el) => el.innerText,
				extractedATags[i]
			);
			await extractedATags[i].hover();
			await instagram.page.waitForTimeout(2000);
			const fCountElement = await instagram.page.waitForSelector(
				"body > div.GdeD6.AzWhO > div > div > div:nth-child(2) > div > div > div:nth-child(2) > span > span"
			);
			const fCount = await instagram.page.evaluate(
				(el) => el.innerText,
				fCountElement
			);
			log(
				`■ Preparing ${Math.trunc(
					(i / extractedDivTags.length) * 100
				)}% ■`
			);
			await instagram.page.mouse.move(0, 100);
			await instagram.page.waitForTimeout(500);

			// items.push({ name, username, fCount });
			fs.appendFile(
				"items.txt",
				`${name} (@${username}); Followers: ${fCount}\n`,
				(err) => {
					if (err) throw err;
				}
			);
		}

		// Save extracted items to a file.
		// var str = items
		// 	.map((elem) => {
		// 		return `${elem.name} (@${elem.username}); Followers: ${elem.fCount}`;
		// 	})
		// 	.join("\n");

		// fs.writeFileSync("./items.txt", str + "\n");

		// Close the browser.
		console.log("Done..!");
		await instagram.browser.close();
	},

	getFollowerInformationViaNewTabs: async () => {
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

		const extractedDivTags = await instagram.page.$x(
			//Followers
			"//html/body/div[5]/div/div/div[2]/ul/div/li/div/div[1]/div[2]/div[2]"
		);
		const extractedATags = await instagram.page.$x(
			"//html/body/div[5]/div/div/div[2]/ul/div/li/div/div[1]/div[2]/div[1]/span/a"
		);
		const items = [];
		for (let i = 0; i < extractedDivTags.length - 1; i++) {
			//First name last name
			const name = await instagram.page.evaluate(
				(el) => el.innerText,
				extractedDivTags[i]
			);
			const username = await instagram.page.evaluate(
				(el) => el.innerText,
				extractedATags[i]
			);

			const newPage = await instagram.browser.newPage();
			await newPage.goto(BASE_URL + username);

			const fCountElementHandle = await newPage.waitForSelector(
				"#react-root > section > main > div > header > section > ul > li:nth-child(2) > a > span, #react-root > section > main > div > header > section > ul > li:nth-child(2) > span > span",
				{
					timeout: 3000,
				}
			);
			const fCount = await newPage.evaluate(
				(el) => el.innerText,
				fCountElementHandle
			);
			await items.push({ name, username, fCount });
			await newPage.close();
		}

		// Save extracted items to a file.
		var str = items
			.map((elem) => {
				return `${elem.name} (@${elem.username}); Followers: ${elem.fCount}`;
			})
			.join("\n");

		fs.writeFileSync("./items.txt", str + "\n");

		// Close the browser.
		await instagram.browser.close();
	},
};

module.exports = instagram;
