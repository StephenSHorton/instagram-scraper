const ig = require("./instagram");

const username = "4stephenhorton@gmail.com";
const password = "001324197Mormondude1";

(async () => {
	await ig.initialize();

	await ig.login(username, password);

	await ig.navigateToProfile();

	await ig.getFollowerInformation();
})();