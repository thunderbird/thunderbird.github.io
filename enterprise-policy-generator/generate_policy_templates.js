// replacement for deprecated request
const bent = require('bent');
const bentGetTEXT = bent('GET', 'string', 200);

const cheerio = require('cheerio');
const git = require("isomorphic-git");
const http = require('isomorphic-git/http/node');
const mdParser = require('md-hierarchical-parser');

const fs = require('fs-extra');
const {
	parse,
	stringify,
	assign
} = require('comment-json');

var templates = [];

function debug(...args) {
	if (debugLevel > 0) {
		console.debug(...args);
	}
}

async function request(url) {
	console.log(" -> ", url);
	// Retry on error, using a hard timeout enforced from the client side.
	let rv;
	for (let i = 0; (!rv && i < 5); i++) {
		if (i > 0) {
			console.error("Retry", i);
			await new Promise(resolve => setTimeout(resolve, 5000));
		}

		let killTimer;
		let killSwitch = new Promise((resolve, reject) => { killTimer = setTimeout(reject, 15000, "HardTimeout"); })
		rv = await Promise
			.race([bentGetTEXT(url), killSwitch])
			.catch(err => {
				console.error('Error in  request', err);
				return null;
			});

		// node will continue to "wait" after the script finished, if we do not
		// clear the timeouts.
		clearTimeout(killTimer);
	}
	return rv;
}

// -----------------------------------------------------------------------------

/**
 * Download the most recent revision of the policies-schema.json for a given tree.
 * 
 * settings.tree - "comm-central" or "mozilla-esr91"
 * settings.lastKnownRevision - most recent known revision, to be notified upon updates
 * 
 * Returns a JSON object.
 */
async function getSchemaRevision(settings) {
	let dir = `data/schema`;
	fs.ensureDirSync(dir);
	let folder = settings.tree.includes("mozilla") ? "browser" : "mail"
	let path = settings.tree.includes("central") ? settings.tree : `releases/${settings.tree}`

	console.log(`Downloading policies-schema.json revisions for ${settings.tree}`);
	let hgLog = await request(`https://hg.mozilla.org/${path}/log/tip/${folder}/components/enterprisepolicies/schemas/policies-schema.json`);
	const $ = cheerio.load(hgLog);

	for (let element of $("body > table > tbody > tr > td:nth-child(2)")) {
		// Get the revision identifier from the table cell
		let revision = element.children[0].data.trim();
		let created = $(element.children[3]).text().split(" ")[0];

		let file = await request(`https://hg.mozilla.org/${path}/raw-file/${revision}/${folder}/components/enterprisepolicies/schemas/policies-schema.json`);
		let fileName = `${dir}/${settings.tree}-${created}-${revision}.json`;
		fs.writeFileSync(fileName, file);

		if (revision != settings["lastKnownRevision"]) {
			console.log("New revision found: ", revision);
		}
		return parse(file);
	}
}

function cleanUp(lines) {
	const replacements = [
		{
			reg: /\bFirefox\b/g,
			val: "Thunderbird",
		},
		{
			reg: /\bfirefox\b/g,
			val: "thunderbird",
		},
		{
			reg: /\bAMO\b/g,
			val: "ATN",
		},
		{
			reg: /addons.mozilla.org/g,
			val: "addons.thunderbird.net",
		}
	]
	
	for (let i=0; i < lines.length; i++) {
		for (let r of replacements) {
			lines[i] = lines[i].replace(r.reg, r.val);
		}
	}

	// We do not state compatibility per policy, but per report
	return lines.filter(e => !e.includes("**Compatibility:**"));
}

async function buildReadme(settings) {
	// policies and header
	let schema = await getSchemaRevision(settings);
	
	let readme = [];
	for (let policy of Object.keys(schema.properties)) {
		let template = templates[settings.templates["*"]];
		
		// Is this an override from the global policy?
		if (settings.templates[policy]) {
			template = templates[settings.templates[policy]];
		}

		if (template.policies[policy]) {			
			readme.push(...template.policies[policy].split("\n"));
		}
	}
	fs.ensureDirSync(settings.output);
	fs.writeFileSync(`${settings.output}/README.md`, cleanUp(readme).join("\n"));
}

/**
 * Download a certain revision of mozilla policy templates.
 * 
 * ref - branch/tag to checkout, "master" or "v3.0"
 */
async function getTemplateRevision(ref) {
	let dir = `data/mozilla-policy-templates/${ref}`;
	fs.removeSync(dir);
	fs.ensureDirSync(dir);
	await git.clone({
		fs,
		http,
		dir,
		url: "https://github.com/mozilla/policy-templates/",
		ref,
		singleBranch: true,
		depth: 10,
		force: true
	});
	
	let file = fs.readFileSync(`${dir}/README.md`, 'utf8');
	
	// Split on ### heading to get chunks of policy descriptions
	let data = file.split("\n### ");
	let header = data.shift();

	let policies = {};
	for (let p of data) {
		let lines = p.split("\n");
		let name = lines[0];
		lines[0] = `### ${name}`;
		policies[name] = lines.join("\n")
	}

	// Log found policies
	console.log(`Policies found in mozilla template ${ref}`, Object.keys(policies))
	return {header, policies};
}

async function main() {
	// Checkout mozilla policies:
	// https://github.com/mozilla/policy-templates/releases
	templates["master"] = await getTemplateRevision("master");
	templates["v3.0"] = await getTemplateRevision("v3.0"); //TB91
	templates["v2.12"] = await getTemplateRevision("v2.12"); //TB78
	templates["v1.17"] = await getTemplateRevision("v1.17"); //TB68

	// Checkout each tree and check if there has been an update
	await buildReadme({
		tree: "comm-central",
		lastKnownRevision: "677f5bd4d2af44fa56de3eb68354243cebf53ab6",
		templates: { // Define which template version should be used as base, allow individual overrides in case of partial uplifts
			"*": "master",
		},
		output: "../thunderbird-policy-templates/master"
	});

	await buildReadme({
		tree: "comm-esr91",
		lastKnownRevision: "2d7ea4fb88ccc2db866a362d2ad71a4850e5b150",
		templates: { // Define which version should be used, allow individual settings
			"*": "v3.0"
		},
		output: "../thunderbird-policy-templates/tb91"
	});
	
	await buildReadme({
		tree: "comm-esr78",
		lastKnownRevision: "4ebc4c2e1bbdd3d9660b519c270dac71bd86717d",
		templates: { // Define which version should be used, allow individual settings
			"*": "v2.12",
			"Preferences": "v1.17",
		},
		output: "../thunderbird-policy-templates/tb78"
	});

	/*		let mc = await getSchemaRevision({
				"name": "mozilla-central",
				"tree": "mozilla-central", 
				"lastKnownRevision": "02bf5ca05376f55029da3645bdc6c8806e306e80"
			});
			let m91 = await getSchemaRevision({
				"name": "mozilla-esr91",
				"tree": "releases/mozilla-esr91",
				"lastKnownRevision": "02bf5ca05376f55029da3645bdc6c8806e306e80",
				"matching-mozilla-policy-release": "v3.0"
			});
			let m78 = await getSchemaRevision({
				"name": "mozilla-esr78",
				"tree": "releases/mozilla-esr78",
				"lastKnownRevision": "a8c4670b6ef144a0f3b6851c2a9d4bbd44fc032a",
				"matching-mozilla-policy-release": "v2.12"
			});
		*/

}

main();