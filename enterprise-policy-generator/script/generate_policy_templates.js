// Debug logging (0 - errors and basic logs only, 1 - verbose debug)
const debugLevel = 0;

const data_dir = "./data";
const schema_dir = `../schema`;

// replacement for deprecated request
const bent = require('bent');
const bentGetTEXT = bent('GET', 'string', 200);

const cheerio = require('cheerio');
const git = require("isomorphic-git");
const http = require('isomorphic-git/http/node');
//const mdParser = require('md-hierarchical-parser');

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

/**
 * bent based request variant with hard timeout on client side.
 * 
 * @param {string} url - url to GET
 * @returns - text content
 */
async function request(url) {
	debug(" -> ", url);
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

function getSchemaFilename(branch, tree, ref) {
	return `${schema_dir}/${branch}-${tree}-${ref}.json`;
}
// -----------------------------------------------------------------------------

/**
 * Download the most recent revision of the policies-schema.json for a given tree.
 * 
 * @params {object} settings
 *  settings.tree - "central" or "esr91"
 *  settings.commPolicyRevision - currently acknowledged comm policy revision
 *  settings.mozillaReferencePolicyRevision - currently acknowledged mozilla policy revision
 * 
 * Returns a data object for comm and mozilla.
 */
async function getSchemaRevisions(settings) {
	let tree = settings.tree;
	let data = {
		comm: {
			currentPolicyRevision: settings["commPolicyRevision"],
			currentFile: null,
			latestFile: null,
			currentRevision: null,
			latestRevision: null,
		},
		mozilla: {
			currentPolicyRevision: settings["mozillaReferencePolicyRevision"],
			currentFile: null,
			latestFile: null,
			currentRevision: null,
			latestRevision: null,
		},
	};

	console.log(`Processing ${tree}`);
	fs.ensureDirSync(schema_dir);


	for (let branch of ["mozilla", "comm"]) {
		let folder = branch == "mozilla" ? "browser" : "mail"
		let path = tree == "central" ? `${branch}-${tree}` : `releases/${branch}-${tree}`

		debug(`Downloading policies-schema.json revisions for ${tree}`);
		data[branch].hgLogUrl = `https://hg.mozilla.org/${path}/log/tip/${folder}/components/enterprisepolicies/schemas/policies-schema.json`;
		let hgLog = await request(data[branch].hgLogUrl);
		const $ = cheerio.load(hgLog);

		// Get the revision identifier from the table cell (TODO: switch to github tree instead of parsing html)
		let revisions = [...$("body > table > tbody > tr > td:nth-child(2)")].map(element => element.children[0].data.trim());
		let currentPolicyRevision = data[branch].currentPolicyRevision;

		if (!revisions.includes(currentPolicyRevision)) {
			console.error(`Unknown policy revision ${currentPolicyRevision} set for ${branch}-${tree}.\nCheck ${hgLogUrl}`);
			return null;
		}

		for (let revision of revisions) {
			let file = await request(`https://hg.mozilla.org/${path}/raw-file/${revision}/${folder}/components/enterprisepolicies/schemas/policies-schema.json`);
			fs.writeFileSync(getSchemaFilename(branch, tree, revision), file);

			if (revision != currentPolicyRevision) {
				// we only need the most recent file, we can ignore any file between latest and current.
				if (!data[branch].latestFile) {
					data[branch].latestFile = parse(file);
					data[branch].latestRevision = revision;
				}
			} else {
				data[branch].currentFile = parse(file);
				data[branch].currentRevision = revision;
				break;
			}
		}
	}
	return data;
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

	for (let i = 0; i < lines.length; i++) {
		for (let r of replacements) {
			lines[i] = lines[i].replace(r.reg, r.val);
		}
	}

	// We do not state compatibility per policy, but per report
	return lines.filter(e => !e.includes("**Compatibility:**"));
}
/**
 * Check for changes in tree.
 * 
 * @param {object} data - Object returned by getSchemaRevisions
 */
function checkChanges(file1, file2) {
	if (!file1?.properties || !file2?.properties)
		return;

	let keys1 = Object.keys(file1.properties);
	let keys2 = Object.keys(file2.properties);
	
	let added = keys2.filter(e => !keys1.includes(e));
	let removed = keys1.filter(e => !keys2.includes(e));

	let changed = keys2.filter(e => keys1.includes(e) && JSON.stringify(file2.properties[e]) != JSON.stringify(file1.properties[e]));

	return {added, removed, changed}
}

async function buildThunderbirdReadme(settings) {
	// Download schema from https://hg.mozilla.org/
	let data = await getSchemaRevisions(settings);
	if (!data)
		return;

	// Get changes and log them.
	let m_m_changes = checkChanges(data.mozilla.currentFile, data.mozilla.latestFile);
	if (m_m_changes) {
		console.log();
		console.log(` Mozilla has released an new policy revision for mozilla-${settings.tree}!`);
		console.log(` Do those changes need to be ported to Thunderbird?`);
		if (m_m_changes.added.length > 0) console.log(` - Mozilla added the following policies:`, m_m_changes.added);
		if (m_m_changes.removed.length > 0) console.log(` - Mozilla removed the following policies:`, m_m_changes.removed);
		if (m_m_changes.changed.length > 0) console.log(` - Mozilla changed properties of the following policies:`, m_m_changes.changed);
		console.log();
		console.log(` - currently acknowledged policy revision (${data.mozilla.currentRevision}): \n\t${getSchemaFilename("mozilla", settings.tree, data.mozilla.currentRevision)}\n`);
		console.log(` - latest available policy revision (${data.mozilla.latestRevision}): \n\t${getSchemaFilename("mozilla", settings.tree, data.mozilla.latestRevision)}\n`);			
		console.log(` - hg change log for mozilla-${settings.tree}: \n\t${data.mozilla.hgLogUrl}\n`);
	}

	let c_c_changes = 	checkChanges(data.comm.currentFile, data.comm.latestFile);
	if (c_c_changes) {
		console.log();
		console.log(` Thunderbird has released an new policy revision for comm-${settings.tree}!`);
		console.log(` Is our documentation still up to date?`);
		if (c_c_changes.added.length > 0) console.log(` - Thunderbird added the following policies:`, c_c_changes.added);
		if (c_c_changes.removed.length > 0) console.log(` - Thunderbird removed the following policies:`, c_c_changes.removed);
		if (c_c_changes.changed.length > 0) console.log(` - Thunderbird changed properties of the following policies:`, c_c_changes.changed);
		console.log();
		console.log(` - currently acknowledged policy revision (${data.comm.currentRevision}): \n\t${getSchemaFilename("comm", settings.tree, data.comm.currentRevision)}\n`);
		console.log(` - latest available policy revision (${data.comm.latestRevision}): \n\t${getSchemaFilename("comm", settings.tree, data.comm.latestRevision)}\n`);			
		console.log(` - hg change log for comm-${settings.tree}: \n\t${data.comm.hgLogUrl}\n`);
	}

	let m_c_diff = 	checkChanges(data.mozilla.currentFile, data.comm.currentFile);
	if (m_c_diff) {
		console.log();
		console.log(` There are differences between the currently acknowledged policy revisions of Mozilla and Thunderbird for the ${settings.tree} branch!`);
		console.log(` That probably means we need to manually adjust our documentations (using a different template version for a specific policy might help already).`);		
		if (m_c_diff.added.length > 0) console.log(` - Thunderbird added extra support for the following policies in the currently acknowledged policy revisions:`, m_c_diff.added);
		if (m_c_diff.removed.length > 0) console.log(` - Thunderbird does not support the following policies in the currently acknowledged policy revisions:`, m_c_diff.removed);
		if (m_c_diff.changed.length > 0) console.log(` - Thunderbird and Mozilla policy properties differ in the following policies in the currently acknowledged policy revisions:`, m_c_diff.changed);
		console.log();
		console.log(` - currently acknowledged mozilla policy revision (${data.mozilla.currentRevision}): \n\t${getSchemaFilename("mozilla", settings.tree, data.mozilla.currentRevision)}\n`);			
		console.log(` - currently acknowledged comm policy revision (${data.comm.currentRevision}): \n\t${getSchemaFilename("comm", settings.tree, data.comm.currentRevision)}\n`);
		console.log(` - available template versions: \n\thttps://github.com/mozilla/policy-templates/releases\n`);
	}
	
	
	// Update mozilla reference templates to match Thunderbird policies.
	return;

	let readme = [];
	for (let policy of Object.keys(schema.properties)) {
		let template = templates[settings.mozillaReferenceTemplates["*"]];

		// Is this an override from the global policy?
		if (settings.mozillaReferenceTemplates[policy]) {
			template = templates[settings.mozillaReferenceTemplates[policy]];
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
	console.log(`Downloading mozilla-policy-template version ${ref}`);

	let dir = `${data_dir}/mozilla-policy-templates/${ref}`;
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
	debug(`Policies found in mozilla template ${ref}`, Object.keys(policies))
	return { header, policies };
}

async function main() {
	fs.removeSync(data_dir);

	// Checkout mozilla policies:
	// https://github.com/mozilla/policy-templates/releases
	templates["master"] = await getTemplateRevision("master");
	templates["v3.0"] = await getTemplateRevision("v3.0"); //TB91
	templates["v2.12"] = await getTemplateRevision("v2.12"); //TB78
	templates["v1.17"] = await getTemplateRevision("v1.17"); //TB68

	// Check status of thunderbird trees and generate policies.
	await buildThunderbirdReadme({
		tree: "central",
		commPolicyRevision: "677f5bd4d2af44fa56de3eb68354243cebf53ab6",
		mozillaReferencePolicyRevision: "02bf5ca05376f55029da3645bdc6c8806e306e80",
		mozillaReferenceTemplates: {
			"*": "master",
		},
		output: "../thunderbird-policy-templates/master",
	});

	await buildThunderbirdReadme({
		tree: "esr91",
		commPolicyRevision: "2d7ea4fb88ccc2db866a362d2ad71a4850e5b150",
		mozillaReferencePolicyRevision: "02bf5ca05376f55029da3645bdc6c8806e306e80",
		mozillaReferenceTemplates: {
			"*": "v3.0"
		},
		output: "../thunderbird-policy-templates/tb91",
	});

	await buildThunderbirdReadme({
		tree: "esr78",
		commPolicyRevision: "4ebc4c2e1bbdd3d9660b519c270dac71bd86717d",
		mozillaReferencePolicyRevision: "a8c4670b6ef144a0f3b6851c2a9d4bbd44fc032a",
		mozillaReferenceTemplates: {
			"*": "v2.12",
			"Preferences": "v1.17", // Preferences had not been backported.
		},
		output: "../thunderbird-policy-templates/tb78",
	});

}

main();