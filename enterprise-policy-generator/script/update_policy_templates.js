/**
 * See https://bugzilla.mozilla.org/show_bug.cgi?id=1732258
 */

// Debug logging (0 - errors and basic logs only, 1 - verbose debug)
const debugLevel = 0;

const mozilla_template_dir = "./data/mozilla-policy-templates";
const thunderbird_template_dir = "./build";
const schema_dir = "./data/schema";
const readme_json_path = "./readme.json";

// replacement for deprecated request
const bent = require('bent');
const bentGetTEXT = bent('GET', 'string', 200);

const cheerio = require('cheerio');
const git = require("isomorphic-git");
const http = require('isomorphic-git/http/node');
const xml2js = require('xml2js');
const util = require('util');
const fs = require('fs-extra');
const path = require("path");

const {
	parse,
	stringify,
	assign
} = require('comment-json');

var parsed_readme_files = [];

function debug(...args) {
	if (debugLevel > 0) {
		console.debug(...args);
	}
}

function dump(data) {
	console.log(util.inspect(data, false, null));
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

function cleanUp(lines) {
	if (!Array.isArray(lines))
		lines = [lines.toString()];

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
			reg: /([\W_])FF(\d\d)/g,
			val: "\$1TB\$2",
		},
		{
			reg: /\bAMO\b/g,
			val: "ATN",
		},
		{
			reg: /addons.mozilla.org/g,
			val: "addons.thunderbird.net",
		},
		{	// Undo a wrong replace
			reg: "https://support.mozilla.org/kb/setting-certificate-authorities-thunderbird",
			val: "https://support.mozilla.org/kb/setting-certificate-authorities-firefox"
		},
		{	// Undo a wrong replace
			reg: "https://support.mozilla.org/en-US/kb/dom-events-changes-introduced-thunderbird-66",
			val: "https://support.mozilla.org/en-US/kb/dom-events-changes-introduced-firefox-66"
		}		
	]

	for (let i = 0; i < lines.length; i++) {
		for (let r of replacements) {
			lines[i] = lines[i].replace(r.reg, r.val);
		}
	}

	// We do not state compatibility per policy, but per report
	return lines
		.filter(e => !e.includes("**Compatibility:**"))
		.join("\n");
}

// -----------------------------------------------------------------------------

/**
 * Download a certain revision of mozilla policy template.
 * 
 * @param {string} ref - branch/tag to checkout, "master" or "v3.0"
 * @param {string} dir - directory to store templates in
 * 
 */
async function updateMozillaPolicyTemplate(ref, dir) {
	if (!fs.existsSync(`${dir}/README.md`)) {
		console.log(`Downloading mozilla-policy-template version ${ref}`);
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
	} else {
		console.log(`Updating mozilla-policy-template version ${ref}`);
		await git.pull({
			author: { name: "generate_policy_template.js" },
			fs,
			http,
			dir,
			ref,
			singleBranch: true,
			force: true
		});
	}
}

/**
 * Parse the README file of a given mozilla policy template.
 * 
 * @param {string} ref - branch/tag to checkout, "master" or "v3.0"
 * @param {string} tree - matching tree, "central" or "esr91"
 * 
 * @return - {headers ({}), policies ({}), upstreamChanges (bool)} 
 */
async function parseMozillaPolicyReadme(ref, tree) {
	// https://github.com/mozilla/policy-templates/releases
	let dir = `${mozilla_template_dir}/${ref}`;
	await updateMozillaPolicyTemplate(ref, dir);

	// Load last known version of the headers and policy chunks.
	let readme = fs.existsSync(readme_json_path)
		? parse(fs.readFileSync(readme_json_path).toString())
		: {};
	if (!readme) readme = {};
	if (!readme[tree]) readme[tree] = {};
	if (!readme[tree].headers) readme[tree].headers = {};
	if (!readme[tree].policies) readme[tree].policies = {};

	// This parsing highly depends on the structure of the README and needs to be
	// adjusted when its layout is changing. In the intro section we have lines like 
	// | **[`3rdparty`](#3rdparty)** |
	// Detailed descriptions are below level 3 headings (###) with potential subsections.

	// Split on ### heading to get chunks of policy descriptions.
	let file = fs.readFileSync(`${dir}/README.md`, 'utf8');
	let data = file.split("\n### ");
	let upstreamChanges = false;

	// Shift out the header and process it.
	for (let h of data.shift().split("\n").filter(e => e.startsWith("| **[`"))) {
		let name = h
			.match(/\*\*\[(.*?)\]/)[1] // extract name from the markdown link
			.replace(/`/g, "") // unable to fix the regex to exclude those
			.replace(" -> ", "_"); // flat hierarchy

		if (!readme[tree].headers[name]) {
			readme[tree].headers[name] = { current: h };
		} else if (!readme[tree].headers[name].current) {
			readme[tree].headers[name].current = h;
		};

		// Detect upstream changes.
		if (readme[tree].headers[name].current != h) {
			readme[tree].headers[name].upstream = h;
			upstreamChanges = true;
		}
	}

	// Process policies.
	for (let p of data) {
		let lines = p.split("\n");
		let name = lines[0];
		lines[0] = `### ${name}`;

		name = name.replace(" | ", "_"); // flat hierarchy
		if (!readme[tree].policies[name]) {
			readme[tree].policies[name] = { current: lines };
		} else if (!readme[tree].policies[name].current) {
			readme[tree].policies[name].current = lines;
		}

		// Detect upstream changes.
		if (stringify(readme[tree].policies[name].current) != stringify(lines)) {
			readme[tree].policies[name].upstream = lines;
			upstreamChanges = true;
		}
	}
	fs.writeFileSync(readme_json_path, stringify(readme, null, 2));

	readme[tree].upstreamChanges = upstreamChanges;
	return readme[tree];
}

function getPolicySchemaFilename(branch, tree, ref) {
	return `${schema_dir}/${branch}-${tree}-${ref}.json`;
}

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
async function downloadPolicySchemaFiles(settings) {
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
			fs.writeFileSync(getPolicySchemaFilename(branch, tree, revision), file);

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

/**
 * Extract flat policy named from a schema file
 * 
 * @param {object} data - Object returned by downloadPolicySchemaFiles
 */
function extractFlatPolicyNamesFromPolicySchema(data) {
	let properties = [];
	if (data.properties) {
		for (let [name, entry] of Object.entries(data.properties)) {
			properties.push(name)
			let subs = extractFlatPolicyNamesFromPolicySchema(entry);
			if (subs.length > 0) properties.push(...subs.map(e => `${name}_${e}`))
		}
	}
	return properties;
}

/**
* Check for changes in the policy schema files in m-c and c-c tree.
* 
* @param {object} data - Object returned by downloadPolicySchemaFiles
*/
function checkPolicySchemaChanges(file1, file2) {
	if (!file1?.properties || !file2?.properties)
		return;

	let keys1 = extractFlatPolicyNamesFromPolicySchema(file1);
	let keys2 = extractFlatPolicyNamesFromPolicySchema(file2);

	let added = keys2.filter(e => !keys1.includes(e));
	let removed = keys1.filter(e => !keys2.includes(e));

	let changed = keys2.filter(e => keys1.includes(e) && JSON.stringify(file2.properties[e]) != JSON.stringify(file1.properties[e]));

	return { added, removed, changed }
}

// -----------------------------------------------------------------------------

async function buildThunderbirdTemplate(settings) {
	// Download schema from https://hg.mozilla.org/
	let data = await downloadPolicySchemaFiles(settings);
	if (!data)
		return;

	// Get changes in the schema files and log them.
	let m_m_changes = checkPolicySchemaChanges(data.mozilla.currentFile, data.mozilla.latestFile);
	if (m_m_changes) {
		console.log();
		console.log(` Mozilla has released an new policy revision for mozilla-${settings.tree}!`);
		console.log(` Do those changes need to be ported to Thunderbird?`);
		if (m_m_changes.added.length > 0) console.log(` - Mozilla added the following policies:`, m_m_changes.added);
		if (m_m_changes.removed.length > 0) console.log(` - Mozilla removed the following policies:`, m_m_changes.removed);
		if (m_m_changes.changed.length > 0) console.log(` - Mozilla changed properties of the following policies:`, m_m_changes.changed);
		console.log();
		console.log(` - currently acknowledged policy revision (${data.mozilla.currentRevision}): \n\t${path.resolve(getPolicySchemaFilename("mozilla", settings.tree, data.mozilla.currentRevision))}\n`);
		console.log(` - latest available policy revision (${data.mozilla.latestRevision}): \n\t${path.resolve(getPolicySchemaFilename("mozilla", settings.tree, data.mozilla.latestRevision))}\n`);
		console.log(` - hg change log for mozilla-${settings.tree}: \n\t${data.mozilla.hgLogUrl}\n`);
	}

	let c_c_changes = checkPolicySchemaChanges(data.comm.currentFile, data.comm.latestFile);
	if (c_c_changes) {
		console.log();
		console.log(` Thunderbird has released an new policy revision for comm-${settings.tree}!`);
		console.log(` Is our documentation still up to date?`);
		if (c_c_changes.added.length > 0) console.log(` - Thunderbird added the following policies:`, c_c_changes.added);
		if (c_c_changes.removed.length > 0) console.log(` - Thunderbird removed the following policies:`, c_c_changes.removed);
		if (c_c_changes.changed.length > 0) console.log(` - Thunderbird changed properties of the following policies:`, c_c_changes.changed);
		console.log();
		console.log(` - currently acknowledged policy revision (${data.comm.currentRevision}): \n\t${path.resolve(getPolicySchemaFilename("comm", settings.tree, data.comm.currentRevision))}\n`);
		console.log(` - latest available policy revision (${data.comm.latestRevision}): \n\t${path.resolve(getPolicySchemaFilename("comm", settings.tree, data.comm.latestRevision))}\n`);
		console.log(` - hg change log for comm-${settings.tree}: \n\t${data.comm.hgLogUrl}\n`);
	}

	/*	TODO: For the readme it would be helpfull to know which properties of used policies are not supported
		// This logs differences between m-c and c-c, but the gain of information is not much, clutters the screen, we know they differ.
		let m_c_diff = checkPolicySchemaChanges(data.mozilla.currentFile, data.comm.currentFile);
		if (m_c_diff) {
			console.log();
			console.log(` There are differences between the currently acknowledged policy revisions of Mozilla and Thunderbird for the ${settings.tree} branch!`);
			if (m_c_diff.added.length > 0) console.log(` - Thunderbird added extra support for the following policies in the currently acknowledged policy revisions:`, m_c_diff.added);
			if (m_c_diff.removed.length > 0) console.log(` - Thunderbird does not support the following policies in the currently acknowledged policy revisions:`, m_c_diff.removed);
			if (m_c_diff.changed.length > 0) console.log(` - Thunderbird and Mozilla policy properties differ in the following policies in the currently acknowledged policy revisions:`, m_c_diff.changed);
			console.log();
			console.log(` - currently acknowledged mozilla policy revision (${data.mozilla.currentRevision}): \n\t${path.resolve(getPolicySchemaFilename("mozilla", settings.tree, data.mozilla.currentRevision))}\n`);
			console.log(` - currently acknowledged comm policy revision (${data.comm.currentRevision}): \n\t${path.resolve(getPolicySchemaFilename("comm", settings.tree, data.comm.currentRevision))}\n`);
			console.log(` - available template versions: \n\thttps://github.com/mozilla/policy-templates/releases\n`);
		}
	*/

	/**
	 * Build the README file.
	 */
	let header = [];
	let details = [];
	let template = await parseMozillaPolicyReadme(settings.mozillaReferenceTemplates, settings.tree);


	// Loop over all policies found in the thunderbird policy schema file and rebuild the readme.
	let thunderbirdPolicies = extractFlatPolicyNamesFromPolicySchema(data.comm.currentFile);
	for (let policy of thunderbirdPolicies) {
		// Get the policy header from the template (or its override).
		if (template.headers[policy]) {
			let content = template.headers[policy].override || template.headers[policy].current;
			if (content && content != "skip") {
				header.push(content);
			}
		} else {
			// Maybe log policies_properties which are not mentioned directly in the readme?
			// console.error("Policy or policy property not present in mozilla readme", policy)
		}
		// Also check for deprecated versions.
		if (template.headers[`${policy} (Deprecated)`]) {
			let content = template.headers[`${policy} (Deprecated)`].override || template.headers[`${policy} (Deprecated)`].current;
			if (content && content != "skip") {
				header.push(content);
			}
		}

		// Get the policy details from the template (or its override).
		if (template.policies[policy]) {
			let content = template.policies[policy].override || template.policies[policy].current;
			if (content && content != "skip") {
				details.push(...content);
			}
		}
		// Also check for deprecated versions.
		if (template.policies[`${policy} (Deprecated)`]) {
			let content = template.policies[`${policy} (Deprecated)`].override || template.policies[`${policy} (Deprecated)`].current;
			if (content && content != "skip") {
				details.push(...content);
			}
		}
	}

	let md = settings.readmeTemplate
		.replace("__list_of_policies", cleanUp(header))
		.replace("__details__", cleanUp(details));

	fs.ensureDirSync(settings.output);
	fs.writeFileSync(`${settings.output}/README.md`, md);


	/**
	 * Build the ADMX/ADML files.
	 */

	// Read ADMX files - https://www.npmjs.com/package/xml2js
	var parser = new xml2js.Parser();
	let admx_file = fs.readFileSync(`${mozilla_template_dir}/${settings.mozillaReferenceTemplates}/windows/firefox.admx`);
	let admx_obj = await parser.parseStringPromise(
		cleanUp(admx_file).replace(/">">/g, '">'), // issue https://github.com/mozilla/policy-templates/issues/801
	);

	// Remove unsupported policies. (Remember, we work with flattened policy_property names here)
	let admxPolicies = admx_obj.policyDefinitions.policies[0].policy;
	admx_obj.policyDefinitions.policies[0].policy = admxPolicies.filter(policy => thunderbirdPolicies.includes(policy.$.name) || thunderbirdPolicies.includes(`${policy.$.name} (Deprecated)`));

	// Rebuild thunderbird.admx file.
	var builder = new xml2js.Builder();
	var xml = builder.buildObject(admx_obj);
	fs.ensureDirSync(`${settings.output}/windows`);
	fs.writeFileSync(`${settings.output}/windows/thunderbird.admx`, xml);

	// Copy mozilla.admx file.
	file = fs.readFileSync(`${mozilla_template_dir}/${settings.mozillaReferenceTemplates}/windows/mozilla.admx`);
	fs.writeFileSync(`${settings.output}/windows/mozilla.admx`, file);

	// Handle translation files.
	let folders = fs.readdirSync(`${mozilla_template_dir}/${settings.mozillaReferenceTemplates}/windows`, { withFileTypes: true })
		.filter(dirent => dirent.isDirectory())
		.map(dirent => dirent.name);
	for (let folder of folders) {
		fs.ensureDirSync(`${settings.output}/windows/${folder}`);
		let file = fs.readFileSync(`${mozilla_template_dir}/${settings.mozillaReferenceTemplates}/windows/${folder}/firefox.adml`);
		fs.writeFileSync(`${settings.output}/windows/${folder}/thunderbird.adml`, cleanUp(file));
		// This file probably does not need to change
		file = fs.readFileSync(`${mozilla_template_dir}/${settings.mozillaReferenceTemplates}/windows/${folder}/mozilla.adml`);
		fs.writeFileSync(`${settings.output}/windows/${folder}/mozilla.adml`, file);
	}
}

async function main() {
	// Check status of thunderbird trees and generate policies.
	await buildThunderbirdTemplate({
		tree: "central",
		commPolicyRevision: "677f5bd4d2af44fa56de3eb68354243cebf53ab6",
		mozillaReferencePolicyRevision: "17c8763d65a017a7e5d1834d2dc674014b97cbea", //"02bf5ca05376f55029da3645bdc6c8806e306e80",
		mozillaReferenceTemplates: "master",
		output: `${thunderbird_template_dir}/master`,
		readmeTemplate: `## Enterprise policy descriptions and templates for Thunderbird (active development)

**These policies are in active development and so might contain changes that do not work with current versions of Thunderbird.**

Policies can be specified using the [Group Policy templates on Windows](windows), [Intune on Windows](https://support.mozilla.org/kb/managing-firefox-intune), [configuration profiles on macOS](mac), or by creating a file called \`policies.json\`. On Windows, create a directory called \`distribution\` where the EXE is located and place the file there. On Mac, the file goes into \`Thunderbird.app/Contents/Resources/distribution\`.  On Linux, the file goes into \`thunderbird/distribution\`, where \`thunderbird\` is the installation directory for Thunderbird, which varies by distribution or you can specify system-wide policy by placing the file in \`/etc/thunderbird/policies\`.

| Policy Name | Description
| --- | --- |
__list_of_policies

__details__

`});

	await buildThunderbirdTemplate({
		tree: "esr91",
		commPolicyRevision: "2d7ea4fb88ccc2db866a362d2ad71a4850e5b150",
		mozillaReferencePolicyRevision: "02bf5ca05376f55029da3645bdc6c8806e306e80",
		mozillaReferenceTemplates: "v3.0",
		output: `${thunderbird_template_dir}/TB91`,
		readmeTemplate: `## Enterprise policy descriptions and templates for Thunderbird 91 and older

Policies can be specified using the [Group Policy templates on Windows](windows), [Intune on Windows](https://support.mozilla.org/kb/managing-firefox-intune), [configuration profiles on macOS](mac), or by creating a file called \`policies.json\`. On Windows, create a directory called \`distribution\` where the EXE is located and place the file there. On Mac, the file goes into \`Thunderbird.app/Contents/Resources/distribution\`.  On Linux, the file goes into \`thunderbird/distribution\`, where \`thunderbird\` is the installation directory for Thunderbird, which varies by distribution or you can specify system-wide policy by placing the file in \`/etc/thunderbird/policies\`.
		
| Policy Name | Description
| --- | --- |
__list_of_policies

__details__

`});

	await buildThunderbirdTemplate({
		tree: "esr78",
		commPolicyRevision: "4ebc4c2e1bbdd3d9660b519c270dac71bd86717d",
		mozillaReferencePolicyRevision: "a8c4670b6ef144a0f3b6851c2a9d4bbd44fc032a",
		mozillaReferenceTemplates: "v2.12",
		output: `${thunderbird_template_dir}/TB78`,
		readmeTemplate: `## Enterprise policy descriptions and templates for Thunderbird 78 and older

Policies can be specified using the [Group Policy templates on Windows](windows), [Intune on Windows](https://support.mozilla.org/kb/managing-firefox-intune), [configuration profiles on macOS](mac), or by creating a file called \`policies.json\`. On Windows, create a directory called \`distribution\` where the EXE is located and place the file there. On Mac, the file goes into \`Thunderbird.app/Contents/Resources/distribution\`.  On Linux, the file goes into \`thunderbird/distribution\`, where \`thunderbird\` is the installation directory for Thunderbird, which varies by distribution or you can specify system-wide policy by placing the file in \`/etc/thunderbird/policies\`.

| Policy Name | Description
| --- | --- |
__list_of_policies

__details__

`});

}

main();
