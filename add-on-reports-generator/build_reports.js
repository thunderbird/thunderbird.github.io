/**
 * This script is heavily based on the work of Christopher Leidigh:
 * https://github.com/cleidigh/ThunderKdB/blob/master/scripts/genExtensionList.js
 */

// Debug logging (0 - errors and basic logs only, 1 - verbose debug)
const debugLevel = 0;

const fs = require('fs-extra');
const request = require('requestretry');

const rootDir = "data";
const reportDir = "../add-on-reports";
const extsAllJsonFileName = `${rootDir}/xall.json`;

const badge_definitions = {
	"probably_compatible": { bRightText: 'probably compatible', bLeftText: 'TB91', bColor: 'darkgreen' },
	"alternative_available": { bRightText: 'alternative available', bLeftText: 'TB91', bColor: 'darkgreen' },
	"work_in_progress": { bRightText: 'work in progress', bLeftText: 'TB91', bColor: 'yellow' },
	"incompatible": { bRightText: 'incompatible', bLeftText: 'TB91', bColor: 'c90016' },
	"probably_incompatible": { bRightText: 'probably incompatible', bLeftText: 'TB91', bColor: 'c90016' },
}

const wip = {
	986686: "https://github.com/thundernest/import-export-tools-ng/tree/v10.1.0",
	90003: "https://github.com/cleidigh/Localfolder-TB/pull/51",
	310: "https://github.com/eyalroz/bidimailui/tree/development",
	331319: "-", //Folder Pane Switcher
	988001: "-", //Attachment Image Viewer/Slideshow
	988100: "-", //Glodaquilla-NG
}

const false_negatives = [
	811161, //WarnAttachments
];


const knownToWork = `4631
15102
711780
640
4654
773590
634298
47144
195275
986258
986325
54035
986338
386321
987716
708783
2533
3254
702920
4970
986685
438634
217293
1556
1279
987798
987783
472193
902
330066
12018
56935
987934
646888
742199
12802
987727
987740
367989
11646
2874
987900
987726
2561
986682
769143
1392
987775
331666
987787
787632
3492
987779
987796
690062
546538
986610
559954
986632
852623
987665
986523
 986643
 11005
 987888
 986372
 987906
 987908
 1898
 287743
 11727
 46207
 360086
 987911
 987914
 10149
 988035
 987865
 987933
 988056
 988138
 987902
 987838
 987979
 988067
 988098
 987987
 988057
 987901
 987928
 988108
 987757
 534258,
 987868
 987664
 987869
 988096
 987988
 987915
 988106
 987976
 987986
 987989`.split("\n").map(e => e.trim());

var gAlternativeData;

var groups = [
	{
		id: "atn-errors",
		header: "Extensions with invalid ATN settings"
	},
	{
		id: "91",
		header: "Thunderbird 91 reports"
	},
	{
		id: "lost",
		header: "ATN lost extension reports"
	},
	{
		id: "atn",
		header: "ATN compatibilits reports"
	},
	{
		id: "all",
		header: "General reports"
	},
]
var reports = {
	"all": {
		group: "all",
		header: "All Extensions compatible with TB60 or newer.",
		template: "report-template.html",
		enabled: true,
		generate: genStandardReport,
		rowData: function (extJson) {
			let vHighest = getExtData(extJson, "91").version ||
				getExtData(extJson, "78").version ||
				getExtData(extJson, "68").version ||
				getExtData(extJson, "60").version;

			return { include: !!vHighest };
		},
	},
	"parsing-error": {
		group: "all",
		header: "Extensions whose XPI files could not be parsed properly and are excluded from analysis.",
		template: "report-template.html",
		enabled: true,
		generate: genStandardReport,
		rowData: function (extJson) {
			let current_version = getExtData(extJson, "current").data;
			return { include: !current_version };
		}
	},
	"recent-activity": {
		group: "all",
		header: "Extensions updated within the last 2 weeks.",
		template: "report-template.html",
		enabled: true,
		generate: genStandardReport,
		rowData: function (extJson) {
			let current_version = getExtData(extJson, "current").data;
			if (current_version) {
				let c = current_version.atn.files[0].created;
				let cv = new Date(c);
				let today = new Date();
				const msDay = 24 * 60 * 60 * 1000;
				let d = (today - cv) / msDay;
				return { include: (d <= 14) };
			}
			return { include: false };
		}
	},
	// -- ATN error reports ------------------------------------------------------------------------
	"wrong-order": {
		group: "atn-errors",
		header: "Extension with wrong upper limit setting in older versions, which will lead to the wrong version reported compatible by ATN.",
		template: "report-template.html",
		enabled: true,
		generate: genStandardReport,
		rowData: function (extJson) {
			let v91 = getExtData(extJson, "91").version;
			let v78 = getExtData(extJson, "78").version;
			let v68 = getExtData(extJson, "68").version;
			let v60 = getExtData(extJson, "60").version;

			if (v60 && v68 && compareVer(v60, v68) > 0) return { include: true };
			if (v60 && v78 && compareVer(v60, v78) > 0) return { include: true };
			if (v60 && v91 && compareVer(v60, v91) > 0) return { include: true };

			if (v68 && v78 && compareVer(v68, v78) > 0) return { include: true };
			if (v68 && v91 && compareVer(v68, v91) > 0) return { include: true };

			if (v78 && v91 && compareVer(v78, v91) > 0) return { include: true };

			return { include: false };
		},
	},
	"max-atn-value-reduced-below-max-xpi-value": {
		group: "atn-errors",
		header: "Extensions whose max version has been reduced in ATN below the XPI value, which is ignored during install and app upgrade (excluding legacy).",
		template: "report-template.html",
		enabled: true,
		generate: genStandardReport,
		rowData: function (extJson) {
			let vCurrent = getExtData(extJson, "current").data;
			if (!vCurrent)
				return { include: false };

			let atn_max = vCurrent?.atn?.compatibility?.thunderbird?.max || "*";
			let strict_max = vCurrent.manifest?.applications?.gecko?.strict_max_version ||
				vCurrent.manifest?.browser_specific_settings?.gecko?.strict_max_version ||
				"*";

			return { include: vCurrent.mext && !vCurrent.legacy && (compareVer(strict_max, atn_max) > 0) };
		}
	},
	"latest-current-mismatch": {
		group: "atn-errors",
		header: "Extensions, where the latest upload is for an older release, which will fail to install in current ESR (current = defined current in ATN) from within the add-on manager.",
		template: "report-template.html",
		enabled: true,
		generate: genStandardReport,
		rowData: function (extJson) {
			let vHighest = getExtData(extJson, "91").version ||
				getExtData(extJson, "78").version ||
				getExtData(extJson, "68").version ||
				getExtData(extJson, "60").version;

			let vCurrent = getExtData(extJson, "current").version;
			return { include: !reports["wrong-order"].rowData(extJson).include && !!vHighest && vHighest != vCurrent };
		},
	},
	"false-positives-tb68": {
		group: "atn-errors",
		header: "Extensions claiming to be compatible with Thunderbird 68, but are legacy extensions and therefore unsupported.",
		template: "report-template.html",
		enabled: true,
		generate: genStandardReport,
		rowData: function (extJson) {
			let data = getExtData(extJson, "68").data;
			return { include: !!data && data.legacy && !data.mext };
		}
	},
	"false-positives-tb78": {
		group: "atn-errors",
		header: "Extensions claiming to be compatible with Thunderbird 78, but are legacy extensions or legacy WebExtensions and therefore unsupported.",
		template: "report-template.html",
		enabled: true,
		generate: genStandardReport,
		rowData: function (extJson) {
			let data = getExtData(extJson, "78").data;
			return { include: !!data && data.legacy };
		}
	},
	// -- Specials v91 -----------------------------------------------------------------------------
	"tb91-worst-case-lost-tb78-to-tb91": {
		group: "91",
		header: "Extensions which have been lost from TB78 to TB91 (including alternatives, possible false positives and possible false negatives).",
		template: "report-template.html",
		enabled: true,
		generate: genStandardReport,
		rowData: function (extJson) {
			let badges = [];

			if (reports['tb91-pure-mx-incompatible'].rowData(extJson).include || false_negatives.includes(extJson.id)) {
				badges.push({ badge: "probably_compatible" });
			} else if (reports['lost-tb78-to-tb91'].rowData(extJson).include) {
				if (getAlternative(extJson)) {
					badges.push({ badge: "alternative_available" });
				} else if (wip[extJson.id]) {
					badges.push({ link: wip[extJson.id], badge: "work_in_progress" });
				} else {
					badges.push({ badge: "incompatible" });
				}
			} else if (reports['tb91-experiments-without-upper-limit'].rowData(extJson).include) {
				if (wip[extJson.id]) {
					badges.push({ link: wip[extJson.id], badge: "work_in_progress" });
				} else {
					badges.push({ badge: "probably_incompatible" });
				}
			}

			return {
				include: badges.length > 0,
				badges
			};
		}
	},
	"tb91-pure-mx-incompatible": {
		group: "91",
		header: "Pure MailExtensions, marked incompatible with TB91, which they probably are not.",
		template: "report-template.html",
		enabled: true,
		generate: genStandardReport,
		rowData: function (extJson) {
			let v78 = getExtData(extJson, "78").data;
			let v91 = getExtData(extJson, "91").data;
			return { include: !!v78 && !v91 && v78.mext && !v78.experiment && !v78.legacy };
		}
	},
	"tb91-max-atn-value-reduced-below-max-xpi-value": {
		group: "91",
		header: "Extensions whose max version has been reduced in ATN below the XPI value to be marked as not compatible with TB91, which is ignored during install and app upgrade.",
		template: "report-template.html",
		enabled: true,
		generate: genStandardReport,
		rowData: function (extJson) {
			let vCurrent = getExtData(extJson, "current").data;
			if (!vCurrent)
				return { include: false };

			let v78 = getExtData(extJson, "78").data;
			let v91 = getExtData(extJson, "91").data;

			let atn_max = vCurrent?.atn?.compatibility?.thunderbird?.max || "*";
			let strict_max = vCurrent.manifest?.applications?.gecko?.strict_max_version ||
				vCurrent.manifest?.browser_specific_settings?.gecko?.strict_max_version ||
				"*";

			return { include: !!v78 && !v91 && (compareVer(strict_max, atn_max) > 0) };
		}
	},
	"tb91-experiments-without-upper-limit": {
		group: "91",
		header: "Experiments without upper limit in ATN, which might not be compatible with TB91 (excluding confirmed positives).",
		template: "report-template.html",
		enabled: true,
		generate: genStandardReport,
		rowData: function (extJson) {
			let v91 = getExtData(extJson, "91").data;
			let atn_max = v91?.atn?.compatibility?.thunderbird?.max || "*";
			let atn_min = v91?.atn?.compatibility?.thunderbird?.min || "*";
			return { include: !knownToWork.includes(`${extJson.id}`) && !!v91 && v91.mext && v91.experiment && compareVer("90", atn_min) > 0 && atn_max == "*" };
		}
	},
	// -- Lost extensions (only useful if all false positives have been removed) -------------------
	"lost-tb60-to-tb68": {
		group: "lost",
		header: "Extensions which have been lost from TB60 to TB68, as seen by ATN.",
		template: "report-template.html",
		enabled: true,
		generate: genStandardReport,
		rowData: function (extJson) {
			let v68 = getExtData(extJson, "68").version;
			let v60 = getExtData(extJson, "60").version;
			return { include: !!v60 && !v68 };
		}
	},
	"lost-tb68-to-tb78": {
		group: "lost",
		header: "Extensions which have been lost from TB68 to TB78, as seen by ATN.",
		template: "report-template.html",
		enabled: true,
		generate: genStandardReport,
		rowData: function (extJson) {
			let v78 = getExtData(extJson, "78").version;
			let v68 = getExtData(extJson, "68").version;
			return { include: !!v68 && !v78 };
		}
	},
	"lost-tb78-to-tb91": {
		group: "lost",
		header: "Extensions which have been lost from TB78 to TB91, as seen by ATN.",
		template: "report-template.html",
		enabled: true,
		generate: genStandardReport,
		rowData: function (extJson) {
			let v91 = getExtData(extJson, "91").version;
			let v78 = getExtData(extJson, "78").version;
			let include = !!v78 && !v91;

			let badges = [];
			if (reports['tb91-pure-mx-incompatible'].rowData(extJson).include || false_negatives.includes(extJson.id)) {
				badges.push({ badge: "probably_compatible" });
			} else if (include) {
				if (getAlternative(extJson)) {
					badges.push({ badge: "alternative_available" });
				} else if (wip[extJson.id]) {
					badges.push({ link: wip[extJson.id], badge: "work_in_progress" });
				} else {
					badges.push({ badge: "incompatible" });
				}
			}
			return { include, badges };
		}
	},
	// -- ATN status reports------------------------------------------------------------------------
	"atn-tb60": {
		group: "atn",
		header: "Extensions compatible with Thunderbird 60 as seen by ATN.",
		template: "report-template.html",
		enabled: true,
		generate: genStandardReport,
		rowData: function (extJson) {
			return { include: !!(getExtData(extJson, "60").version) };
		},
	},
	"atn-tb68": {
		group: "atn",
		header: "Extensions compatible with Thunderbird 68 as seen by ATN.",
		template: "report-template.html",
		enabled: true,
		generate: genStandardReport,
		rowData: function (extJson) {
			return { include: !!(getExtData(extJson, "68").version) };
		}
	},
	"atn-tb78": {
		group: "atn",
		header: "Extensions compatible with Thunderbird 78 as seen by ATN.",
		template: "report-template.html",
		enabled: true,
		generate: genStandardReport,
		rowData: function (extJson) {
			return { include: !!(getExtData(extJson, "78").version) };
		}
	},
	"atn-tb91": {
		group: "atn",
		header: "Extensions compatible with Thunderbird 91 as seen by ATN.",
		template: "report-template.html",
		enabled: true,
		generate: genStandardReport,
		rowData: function (extJson) {
			let badges = [];
			if (reports['tb91-experiments-without-upper-limit'].rowData(extJson).include) {
				badges.push({ badge: "probably_incompatible" });
			}
			if (wip[extJson.id]) {
				badges.push({ link: wip[extJson.id], badge: "work_in_progress" });
			}

			return {
				include: !!(getExtData(extJson, "91").version),
				badges
			};
		}
	},
	"max-atn-value-raised-above-max-xpi-value": {
		group: "atn",
		header: "Extensions whose max version has been raised in ATN above the XPI value (excluding legacy extensions).",
		template: "report-template.html",
		enabled: true,
		generate: genStandardReport,
		rowData: function (extJson) {
			let vCurrent = getExtData(extJson, "current").data;
			if (!vCurrent)
				return { include: false };

			let atn_max = vCurrent?.atn?.compatibility?.thunderbird?.max || "*";
			let strict_max = vCurrent.manifest?.applications?.gecko?.strict_max_version ||
				vCurrent.manifest?.browser_specific_settings?.gecko?.strict_max_version ||
				"*";

			return { include: vCurrent.mext && !vCurrent.legacy && (compareVer(strict_max, atn_max) < 0) };
		}
	},
}

// -----------------------------------------------------------------------------

function genStandardReport(extsJson, name, report) {
	let extsListFile = fs.readFileSync(report.template, 'utf8');
	let rows = [];
	let stats = [];

	function genStandardRow(extJson, rowData) {
		let default_locale = extJson.default_locale;
		if (default_locale === undefined) {
			if (typeof extJson.name["en-US"] === 'string') {
				default_locale = "en-US";
			} else {
				let locales = Object.keys(extJson.name);
				default_locale = extJson.name[locales[0]];
			}
		} else {
			if (typeof extJson.name["en-US"] !== 'string') {
				let locales = Object.keys(extJson.name);
				default_locale = locales[0];
			}
		}

		const idSlug = `${extJson.id}-${extJson.slug}`;
		const name_link = `<a id="${idSlug}" href="${extJson.url}">${extJson.name[default_locale].substr(0, 38)}</a>`;

		let rank = extJson.xpilib.rank;
		let current_version = getExtData(extJson, "current").data;
		let v_min = current_version?.atn.compatibility.thunderbird.min || "*";
		let v_max = current_version?.atn.compatibility.thunderbird.max || "*";
		let v_strict_max = current_version?.manifest?.applications?.gecko?.strict_max_version ||
			current_version?.manifest?.browser_specific_settings?.gecko?.strict_max_version ||
			"*";

		// Helper function to return the version cell for a given ESR
		const cv = (esr) => {
			let rv = [];
			let { version, data } = getExtData(extJson, esr);

			if (version) {
				rv.push(version);
			}

			if (data) {
				let cBadge_type_setup = { bLeftText: 'T', bRightText: 'MX', bColor: 'purple', bTooltip: "Extension Type:" };
				let cBadge_legacy_setup = { bLeftText: 'L', bRightText: '+', bColor: 'green', bTooltip: "Legacy Type:" };
				let cBadge_experiment_setup = { bLeftText: 'E', bRightText: '+', bColor: 'blue', bTooltip: "Experiment APIs: " };

				if (data.mext == true && data.legacy == false) {
					cBadge_type_setup.bRightText = "MX"
					cBadge_type_setup.bTooltip += "&#10; - MX : MailExtension (manifest.json)";
				} else if (data.mext == true && data.legacy == true) {
					cBadge_type_setup.bRightText = "WE"
					cBadge_type_setup.bTooltip += "&#10; - WE : Legacy WebExtension (manifest.json)";
				} else {
					cBadge_type_setup.bRightText = "RDF";
					cBadge_type_setup.bTooltip += "&#10; - RDF : Legacy Extension (install.rdf)";
				}
				rv.push(makeBadgeElement(cBadge_type_setup));

				if (data.legacy == true) {
					if (data.legacy_type == 'xul') {
						cBadge_legacy_setup.bRightText = "XUL"
						cBadge_legacy_setup.bTooltip += "&#10; - XUL : XUL overlay (requires restart)";
					} else {
						cBadge_legacy_setup.bRightText = "BS"
						cBadge_legacy_setup.bTooltip += "&#10; - RS : Bootstrap";
					}
					rv.push(makeBadgeElement(cBadge_legacy_setup));
				}

				if (data.experiment) {
					if (data.experimentSchemaNames.includes("WindowListener")) {
						cBadge_experiment_setup.bRightText = "WL"
					} else if (data.experimentSchemaNames.includes("BootstrapLoader")) {
						cBadge_experiment_setup.bRightText = "BL"
					}

					let schema = data.experimentSchemaNames;
					if (schema) {
						let max = Math.min(schema.length, 14);
						for (let index = 0; index < max; index++) {
							cBadge_experiment_setup.bTooltip += `&#10; - ${schema[index]}`;
						};

						if (data.experimentSchemaNames.length > 15) {
							cBadge_experiment_setup.bTooltip += "&#10; ...";
						}
					}
					rv.push(makeBadgeElement(cBadge_experiment_setup));
				}
			}

			return rv.join("<br>");
		}

		return `
		<tr>
		  <td style="text-align: right" valign="top">${rank}</td>
		  <td style="text-align: right" valign="top">${extJson.id}</td>
		  <td style="text-align: left"  valign="top">${name_link}${getAlternative(extJson) ? getAlternative(extJson).join("") : ""}</td>
		  <td style="text-align: right" valign="top">${extJson.average_daily_users}</td>
		  <td style="text-align: right" valign="top">${cv("60")}</td>
		  <td style="text-align: right" valign="top">${cv("68")}</td>
		  <td style="text-align: right" valign="top">${cv("78")}</td>
		  <td style="text-align: right" valign="top">${cv("91")}</td>
		  <td style="text-align: right" valign="top">${current_version?.atn.files[0].created.split('T')[0]}</td>
		  <td style="text-align: right" valign="top">${cv("current")}</td>
		  <td style="text-align: right" valign="top">${v_min}</td>
		  <td style="text-align: right" valign="top">${v_strict_max}</td>
		  <td style="text-align: right" valign="top">${v_max}</td>
		  <td style="text-align: right; font-style: italic" valign="top">${rowData.badges ? rowData.badges.map(e => makeBadgeElement(badge_definitions[e.badge], e.link)).join("<br>") : ""}</td>
		</tr>`;
	}

	extsJson.map((extJson, index) => {
		debug('Extension ' + extJson.id + ' Index: ' + index);

		if (extJson === null) {
			return "";
		}

		if (extJson.xpilib === undefined) {
			console.error('Error, xpilib data missing: ' + extJson.slug);
			extJson.xpilib = {};
		}
		extJson.xpilib.rank = index + 1;

		let rowData = report.rowData(extJson);
		if (rowData.include) {
			rows.push(genStandardRow(extJson, rowData));
			if (rowData.badges) stats.push(...rowData.badges);
		} else {
			debug('Skip ' + extJson.slug);
		}
	})

	// Calculate stats
	let stats_counts = {};
	for (let i = 0; i < stats.length; i++) {
		stats_counts[stats[i].badge] = 1 + (stats_counts[stats[i].badge] || 0);
	};
	// Generate stats
	let stats_entries = [];
	for (let [name, count] of Object.entries(stats_counts)) {
		stats_entries.push(`<tr><td style="text-align: right">${count}</td><td>${makeBadgeElement(badge_definitions[name])}</td></tr>`)
	}
	if (stats_entries.length > 0) {
		stats_entries.unshift("<h3>Statistics</h3>", "<table class='statstable'>");
		stats_entries.push("</table>");
	}


	extsListFile = extsListFile.replace('__header__', report.header);
	extsListFile = extsListFile.replace('__description__', report.description);

	extsListFile = extsListFile.replace('__count__', rows.length);
	let today = new Date().toISOString().split('T')[0];
	extsListFile = extsListFile.replace('__date__', today);
	extsListFile = extsListFile.replace('__table__', rows.join("\n"));

	extsListFile = extsListFile.replace('__stats__', stats_entries.join("\n"));

	fs.ensureDirSync(`${reportDir}`);
	fs.writeFileSync(`${reportDir}/${name}.html`, extsListFile);

	debug('Done');
	return rows.length;
}

// -----------------------------------------------------------------------------

function debug(...args) {
	if (debugLevel > 0) {
		console.debug(...args);
	}
}

function makeBadgeElement(bOpt, bLink) {
	let title = bOpt.bTooltip ? `title='${bOpt.bTooltip}'` : ``;
	let tag = `<img src='https://img.shields.io/badge/${bOpt.bLeftText}-${bOpt.bRightText}-${bOpt.bColor}.png' ${title}>`
	return bLink ? `<a href="${bLink}">${tag}</a>` : tag;
}

// A versioncompare, taken from https://jsfiddle.net/vanowm/p7uvtbor/
function compareVer(a, b) {
	function prep(t) {
		return ("" + t)
			//treat non-numerical characters as lower version
			//replacing them with a negative number based on charcode of first character
			.replace(/[^0-9\.]+/g, function (c) { return "." + ((c = c.replace(/[\W_]+/, "")) ? c.toLowerCase().charCodeAt(0) - 65536 : "") + "." })
			//remove trailing "." and "0" if followed by non-numerical characters (1.0.0b);
			.replace(/(?:\.0+)*(\.-[0-9]+)(\.[0-9]+)?\.*$/g, "$1$2")
			.split('.');
	}

	if (a != "*" && b == "*") return -1;
	if (a == "*" && b != "*") return 1;
	if (a == "*" && b == "*") return 0;

	a = prep(a);
	b = prep(b);
	for (var i = 0; i < Math.max(a.length, b.length); i++) {
		//convert to integer the most efficient way
		a[i] = ~~a[i];
		b[i] = ~~b[i];
		if (a[i] > b[i])
			return 1;
		else if (a[i] < b[i])
			return -1;
	}
	return 0;
}

// Returns the special xpilib object for the given ESR (or current).
function getExtData(extJson, esr) {
	let cmp_data = extJson?.xpilib?.cmp_data;
	let version = cmp_data
		? cmp_data[esr]
		: null;

	let ext_data = extJson?.xpilib?.ext_data;
	let data = version && ext_data
		? ext_data[version]
		: null;

	return { version, data };
}

async function loadAlternativeData() {
	let extRequestOptions = {
		url: "https://raw.githubusercontent.com/thundernest/extension-finder/master/data.yaml",
		//		json: true,
		maxAttempts: 5,   // (default) try 5 times
		retryDelay: 5000,  // (default) wait for 5s before trying again
		retryStrategy: request.RetryStrategies.HTTPOrNetworkError, // (default) retry on 5xx or network errors
		headers: {
			'User-Agent': 'request'
		}
	}
	return request(extRequestOptions).then(r => r.body).then(alternativeDataToLinks);
}

async function alternativeDataToLinks(data) {
	let entries = {};

	let lines = data.split(/\r\n|\n/);
	let i = 0;

	do {
		let entry = {};
		while (i < lines.length) {
			i++;
			let line = lines[i - 1].trim();

			// End of Block
			if (line.startsWith("---")) {
				break;
			}
			// Skip comments.
			if (line.startsWith("#")) {
				continue;
			}
			let parts = line.split(":");
			let key = parts.shift().trim();
			if (key) {
				let value = parts.join(":").trim();
				entry[key] = value;
			}
		}

		// Add found entry.
		if (Object.keys(entry).length > 0) {
			if (!entries[entry.u_id]) {
				entries[entry.u_id] = [];
			}
			if (entry.r_link)
				entries[entry.u_id].push(`<br> &#8627; <a href="${entry.r_link}">${entry.r_name}</a>`);
			else
				entries[entry.u_id].push(`<br> &#8627; ${entry.r_name}`);

		}
	} while (i < lines.length);

	return entries;
}

function getAlternative(extJson) {
	return gAlternativeData[extJson.guid];
}

// -----------------------------------------------------------------------------

function genIndex(index) {
	let extsListFile = fs.readFileSync("index-template.html", 'utf8');
	let today = new Date().toISOString().split('T')[0];
	extsListFile = extsListFile.replace('__date__', today);
	extsListFile = extsListFile.replace('__index__', index.join(""));
	fs.ensureDirSync(`${reportDir}`);
	fs.writeFileSync(`${reportDir}/index.html`, extsListFile);
}

async function main() {
	console.log("Downloading alternative add-ons data...");
	gAlternativeData = await loadAlternativeData();

	console.log('Generating reports...');
	let extsJson = fs.readJSONSync(extsAllJsonFileName);
	let index = [];
	for (let group of groups) {
		index.push(`<h1><a name="group${group.id}"></a>${group.header}</h1>`);
		for (let [name, report] of Object.entries(reports)) {
			if (report.enabled && report.group == group.id) {
				console.log("  -> " + name);
				let counts = report.generate(extsJson, name, report);
				index.push(`<p><a href="${name}.html">${name}</a> (${counts})</p><blockquote><p>${report.header}</p></blockquote>`);
			}
		}
	}
	genIndex(index);
}

main();