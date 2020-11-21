const ig = require("./instagram");

const username = "modernaspect";
const password = "Jazzordie1";

(async () => {
	await ig.initialize();

	await ig.login(username, password);

	await ig.navigateToProfile();

	// await ig.getFollowerInformation();
	await ig.getFollowerInformationViaNewTabs();
})();
