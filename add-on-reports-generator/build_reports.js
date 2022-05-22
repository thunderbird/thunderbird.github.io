/**
 * This script is heavily based on the work of Christopher Leidigh:
 * https://github.com/cleidigh/ThunderKdB/blob/master/scripts/genExtensionList.js
 */

// Debug logging (0 - errors and basic logs only, 1 - verbose debug)
const debugLevel = 0;

const fs = require('fs-extra');

// replacement for deprecated request
const bent = require('bent');
const bentGetTEXT = bent('GET', 'string', 200);

const rootDir = "data";
const reportDir = "../add-on-reports";
const extsAllJsonFileName = `${rootDir}/xall.json`;

const badge_definitions = {
    "permission": { bLeftText: 'p', bColor: 'orange', bTooltip: "Requested permission" },
    "alternative_available": { bRightText: 'alternative available', bLeftText: '*', bColor: 'darkgreen' },
    "wip102": { bRightText: 'work in progress', bLeftText: 'TB102', bColor: 'yellow' },
    "incompatible91": { bRightText: 'incompatible', bLeftText: 'TB91', bColor: 'c90016' },
    "incompatible102": { bRightText: 'incompatible', bLeftText: 'TB102', bColor: 'c90016' },
    "compatible102": { bRightText: 'compatible', bLeftText: 'TB102', bColor: 'darkgreen' },
    "unknown": { bRightText: 'unknown', bLeftText: 'TB102', bColor: 'D3D3D3' },

}

const wip102 = [
    "217293", //addon/signal-spam/
    "986338", //addon/eas-4-tbsync
    "986258", //addon/dav-4-tbsync 
]

const knownWorking102 = [
    "986685", //addon/phoenity-icons/
    "4654",   //addon/removedupes
    "386321", //addon/Lightning calendar tabs
    "4970",   //addon/tag-toolbar/
    "56935",  //addon/identity-chooser/
    "12018",  //addon/quick-folder-move
    "742199", //addon/attach-from-clipboard/
    "987908", //addon/deepl-selected-text/
    "987727", //addon/monterail-full-dark-2/
    "987995", //addon/hide-local-folders-for-tb78/
    "2874",   //addon/folder-account/
    "11727",  //addon/refwdformatter/
    "987726", //addon/monterail-dark-2-0-for-tb-68/
    "640",    //addon/quicktext
    "331666", //addon/quickarchiver/
    "360086", //addon/toggle-headers/
    "987914", //addon/filter-on-folder-button/
    "987865", //addon/previous-colors/
    "10149",  //addon/new-tab-button/
    "988056", //addon/get-all-mail-button-for-tb78/
    "988098", //addon/thunderbird-todoist/
    "988057", //addon/keeprunning/
    "987925", //addon/eml-editor/
    "987838", //addon/sender-domain/
    "986610", //addon/userchromejs-2/
    "987901", //addon/transfer-immunity/
    "12802",  //addon/phoenity-buttons/
    "987911", //addon/spam-scores/
    "987757", //addon/taskviewstyles
    "987868", //addon/next-unread-group/
    "987863", //addon/eventview/
    "987869", //addon/next-unread-thread/
    "988106", //addon/toggle-address-box/ - Fixed probably soon
    "987988", //addon/toggle-inline/
    "987986", ///addon/select-prev-on-delete/
    "987665", //addon/lefttodaysubpaneorlogoorclock/
    "987945", //addon/treechildrenheight50/
    "987989", //addon/toggle-summary/
    "988086", //addon/confirmconversionsatselecting/
    "1279", //addon/xpunge/
    "987844", ///addon/insertsignature/
    "987821", //openattachmentbyextension/
    "986522", //addon/popmaillistrecipients-2/
    "546538", //addon/single-domain/
    "987860", //addon/empty-folder/
];

const knownBroken102 = [
    "708783", //[ ] addon/emojiaddin/ - sidebar is not working
    "330066", //[ ] addon/edit-email-subject/ - copies the message
    "1898",   //[ ] addon/folderflags/ - has Quota and Flags tab swapped
    "987978", //[x] addon/monterail-darkness-extended/ - uses old WL
    "988131", //[x] addon/largermessagelist/ - uses old WL
    //"219725", //[-] addon/autoslide/ - broken
    //"986572", //[ ] addon/flat-folder-tree-updated/ - broken, core does not seem to support add-on modes anymore -> API
    //"988119", //addon/hera-test-demo/ - Demo - will not be updated
];

var gAlternativeData;

var groups = [
    {
        id: "atn-errors",
        header: "Extensions with invalid ATN settings"
    },
    {
        id: "all",
        header: "General reports"
    },
    {
        id: "102",
        header: "Thunderbird 102 reports"
    },
    {
        id: "91",
        header: "Thunderbird 91 reports"
    },
    {
        id: "78",
        header: "Thunderbird 78 reports"
    },
    {
        id: "68",
        header: "Thunderbird 68 reports"
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
            let vHighest = getExtData(extJson, "102").version ||
                getExtData(extJson, "91").version ||
                getExtData(extJson, "78").version ||
                getExtData(extJson, "68").version ||
                getExtData(extJson, "60").version;

            return { include: !!vHighest };
        },
    },
    "purge-candidates": {
        group: "all",
        header: "All Extensions not compatible with TB78, which should be purged from ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v78 = getExtData(extJson, "78").version;
            let v91 = getExtData(extJson, "91").version;
            let v102 = getExtData(extJson, "102").version;
            return { include: !v78 && !v91 && !v102};
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
    "max-atn-value-raised-above-max-xpi-value": {
        group: "all",
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

            let include = vCurrent.mext && !vCurrent.legacy && (compareVer(strict_max, atn_max) < 0);
            let badges = [];
            if (knownBroken102.includes(`${extJson.id}`)) {
                badges.push({ badge: "incompatible102" });
            } else if (knownWorking102.includes(`${extJson.id}`)) {
                badges.push({ badge: "compatible102" });
            } else if (wip102.includes(`${extJson.id}`)) {
                badges.push({ badge: "wip102" });
            } else {
                badges.push({ badge: "unknown" });
            }

            return { include, badges };
        }
    },
    "requested-permissions": {
        group: "all",
        header: "Extensions requesting WebExtension permissions.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let data = getExtData(extJson, "current").data;
            let badges = [];

            let permissions = data?.manifest?.permissions;
            if (Array.isArray(permissions)) {
                for (let permission of permissions) {
                    // We do not see each individual contentScript definition
                    if (permission.includes(":/") || permission == "<all_urls>") {
                        if (badges.filter(e => e.badge == "permission.contentScript").length == 0) {
                            badges.push({ badge: `permission.contentScript` });
                        }
                    } else {
                        badges.push({ badge: `permission.${permission}` });
                    }
                }
            }

            let manifest = data?.manifest;
            const keys = ["compose_action", "browser_action", "message_display_action", "cloud_file", "commands"];
            if (manifest) {
                for (let key of keys)
                    if (manifest[key])
                        badges.push({ badge: `permission.${key}` });
            }

            return {
                include: !!permissions,
                badges
            };
        },
    },
    // -- ATN error reports ------------------------------------------------------------------------
    "wrong-order": {
        group: "atn-errors",
        header: "Extension with wrong upper limit setting in older versions, which will lead to the wrong version reported compatible by ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v102 = getExtData(extJson, "102").version;
            let v91 = getExtData(extJson, "91").version;
            let v78 = getExtData(extJson, "78").version;
            let v68 = getExtData(extJson, "68").version;
            let v60 = getExtData(extJson, "60").version;

            if (v60 && v68 && compareVer(v60, v68) > 0) return { include: true };
            if (v60 && v78 && compareVer(v60, v78) > 0) return { include: true };
            if (v60 && v91 && compareVer(v60, v91) > 0) return { include: true };
            if (v60 && v102 && compareVer(v60, v102) > 0) return { include: true };

            if (v68 && v78 && compareVer(v68, v78) > 0) return { include: true };
            if (v68 && v91 && compareVer(v68, v91) > 0) return { include: true };
            if (v68 && v102 && compareVer(v68, v102) > 0) return { include: true };

            if (v78 && v91 && compareVer(v78, v91) > 0) return { include: true };
            if (v78 && v102 && compareVer(v78, v102) > 0) return { include: true };

            if (v91 && v102 && compareVer(v91, v102) > 0) return { include: true };

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

            let include = vCurrent.mext && !vCurrent.legacy && (compareVer(strict_max, atn_max) > 0);
            let badges = [];
            if (knownBroken102.includes(`${extJson.id}`)) {
                badges.push({ badge: "incompatible102" });
            } else if (knownWorking102.includes(`${extJson.id}`)) {
                badges.push({ badge: "compatible102" });
            } else if (wip102.includes(`${extJson.id}`)) {
                badges.push({ badge: "wip102" });
            } else {
                badges.push({ badge: "unknown" });
            }

            return { include, badges };
        }
    },
    "latest-current-mismatch": {
        group: "atn-errors",
        header: "Extensions, where the latest upload is for an older release, which will fail to install in current ESR (current = defined current in ATN) from within the add-on manager.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let vHighest = getExtData(extJson, "102").version ||
                getExtData(extJson, "91").version ||
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
    // -- v102 -------------------------------------------------------------------------------------
    "atn-tb102": {
        group: "102",
        header: "Extensions compatible with Thunderbird 102 as seen by ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let badges = [];
            if (knownBroken102.includes(`${extJson.id}`)) {
                badges.push({ badge: "incompatible102" });
            } else if (knownWorking102.includes(`${extJson.id}`)) {
                badges.push({ badge: "compatible102" });
            } else if (wip102.includes(`${extJson.id}`)) {
                badges.push({ badge: "wip102" });
            } else {
                badges.push({ badge: "unknown" });
            }

            return {
                include: !!(getExtData(extJson, "102").version),
                badges
            };
        }
    },
    "valid-according-to-strict-max-but-atn-value-reduced": {
        group: "102",
        header: "Extensions whose strict_max_version allows installation in Thunderbird 102, but ATN value has been lowered (which is ignored during install and app upgrade).",
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

            let include = 
                vCurrent.mext && // WebExtension
                !vCurrent.legacy && // Not legacy
                compareVer(strict_max, 102) > 0 && // strict max not below 102/* (add-ons with max xpi 97 do not install)
                compareVer(strict_max, atn_max) > 0 && // atn lower than xpi (which is ignored)
                compareVer(atn_max, 91) >= 0 && // atn limit > 91 (if it is lowered below 91, it is already lost from 78 to 91)
                compareVer(atn_max, "102.*") < 0; // atn limit < 102.*

            let badges = [];
            if (knownBroken102.includes(`${extJson.id}`)) {
                badges.push({ badge: "incompatible102" });
            } else if (knownWorking102.includes(`${extJson.id}`)) {
                badges.push({ badge: "compatible102" });
            } else if (wip102.includes(`${extJson.id}`)) {
                badges.push({ badge: "wip102" });
            } else {
                badges.push({ badge: "unknown" });
            }

            return { include, badges };
        }
    },
    "tb102-experiments-with-102-0-limit": {
        group: "102",
        header: "Experiments who have an upper limit of 102.0.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v102 = getExtData(extJson, "102").data;
            let atn_max = v102?.atn?.compatibility?.thunderbird?.max || "*";

            let include = atn_max == "102.0";
            return { include };
        }
    },    
    "tb102-incompatible": {
        group: "102",
        header: "Experiments known to be incompatible with TB102 .",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let include = knownBroken102.includes(`${extJson.id}`) || wip102.includes(`${extJson.id}`);
            
            let badges = [];            
            if (getAlternative(extJson)) {
                badges.push({ badge: "alternative_available" });
            }
            if (knownBroken102.includes(`${extJson.id}`)) {
                badges.push({ badge: "incompatible102" });
            } else if (knownWorking102.includes(`${extJson.id}`)) {
                badges.push({ badge: "compatible102" });
            } else if (wip102.includes(`${extJson.id}`)) {
                badges.push({ badge: "wip102" });
            } else {
                badges.push({ badge: "unknown" });
            }

            return { include, badges };
        }
    },
    "lost-tb91-to-tb102": {
        group: "102",
        header: "Extensions which have been lost from TB91 to TB102 as seen by ATN",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v102 = getExtData(extJson, "102").version;
            let v91 = getExtData(extJson, "91").version;
            let include = !!v91 && !v102;

            let badges = [];
            if (include) {
                if (getAlternative(extJson)) {
                    badges.push({ badge: "alternative_available" });
                }
                if (knownBroken102.includes(`${extJson.id}`)) {
                    badges.push({ badge: "incompatible102" });
                } else if (knownWorking102.includes(`${extJson.id}`)) {
                    badges.push({ badge: "compatible102" });
                } else if (wip102.includes(`${extJson.id}`)) {
                    badges.push({ badge: "wip102" });
                } else {
                    badges.push({ badge: "unknown" });
                }
            }
            return { include, badges };
        }
    },
    // -- v91 --------------------------------------------------------------------------------------
    "atn-tb91": {
        group: "91",
        header: "Extensions compatible with Thunderbird 91 as seen by ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let badges = [];

            return {
                include: !!(getExtData(extJson, "91").version),
                badges
            };
        }
    },
    "lost-tb78-to-tb91": {
        group: "91",
        header: "Extensions which have been lost from TB78 to TB91, as seen by ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v91 = getExtData(extJson, "91").version;
            let v78 = getExtData(extJson, "78").version;
            let include = !!v78 && !v91;

            let badges = [];
            if (include) {
                if (getAlternative(extJson)) {
                    badges.push({ badge: "alternative_available" });
                } else {
                    badges.push({ badge: "incompatible91" });
                }
            }
            return { include, badges };
        }
    },
    // -- v78 --------------------------------------------------------------------------------------
    "atn-tb78": {
        group: "78",
        header: "Extensions compatible with Thunderbird 78 as seen by ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            return { include: !!(getExtData(extJson, "78").version) };
        }
    },
    "lost-tb68-to-tb78": {
        group: "78",
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
    // -- 68 ------------------------------------------------------------------- -------------------
    "atn-tb68": {
        group: "68",
        header: "Extensions compatible with Thunderbird 68 as seen by ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            return { include: !!(getExtData(extJson, "68").version) };
        }
    },
    "lost-tb60-to-tb68": {
        group: "68",
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
		  <td style="text-align: right" valign="top">${cv("102")}</td>
		  <td style="text-align: right" valign="top">${current_version?.atn.files[0].created.split('T')[0]}</td>
		  <td style="text-align: right" valign="top">${cv("current")}</td>
		  <td style="text-align: right" valign="top">${v_min}</td>
		  <td style="text-align: right" valign="top">${v_strict_max}</td>
		  <td style="text-align: right" valign="top">${v_max}</td>
		  <td style="text-align: right; font-style: italic" valign="top">${rowData.badges ? rowData.badges.map(e => getBadgeElement(e.badge, e.link)).join("<br>") : ""}</td>
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

    function sortStats(a, b) {
        if (a[1] > b[1]) return -1;
        if (a[1] < b[1]) return 1;
        return 0;
    }

    // Generate stats
    let stats_entries = [];
    for (let [name, count] of Object.entries(stats_counts).sort(sortStats)) {
        stats_entries.push(`<tr><td style="text-align: right">${count}</td><td>${getBadgeElement(name)}</td></tr>`)
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

function getBadgeElement(badgeName, bLink) {
    // manipulate bRightText to reuse base bage
    let badgeParts = badgeName.split(".");
    let badgeOpt = badge_definitions[badgeName];
    if (!badgeOpt && Array.isArray(badgeParts) && badge_definitions[badgeParts[0]]) {
        badgeOpt = badge_definitions[badgeParts[0]];
        badgeOpt.bRightText = badgeParts.slice(1).join(".");
    }
    return makeBadgeElement(badgeOpt, bLink);
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
    return bentGetTEXT("https://raw.githubusercontent.com/thundernest/extension-finder/master/data.yaml").then(alternativeDataToLinks);
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
