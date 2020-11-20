const ig = require("./instagram");

const username = "youremailhere@gmail.com";
const password = "yourpasswordhere";

(async () => {
	await ig.initialize();

	await ig.login(username, password);

	await ig.navigateToProfile();

	await ig.getFollowerInformation();
	// await ig.getFollowerInformationViaNewTabs();
})();
