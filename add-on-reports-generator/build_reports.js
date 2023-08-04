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

const SUPPORTED_ESR = [60, 68, 78, 91, 102, 115];

const badge_definitions = {
    "permission": { bLeftText: 'p', bColor: 'orange', bTooltip: "Requested Permission" },
    "alternative_available": { bRightText: 'Alternative Available', bLeftText: '*', bColor: 'darkgreen' },
    "discontinued": { bRightText: 'Discontinued', bLeftText: '⠀', bColor: 'D3D3D3' },
    "contacted": { bRightText: 'Waiting for Feedback', bLeftText: '⠀', bColor: 'ff8800' },
    "theme_experiment": { bRightText: 'Theme Experiment', bLeftText: '⠀', bColor: 'blue' },
    "pure": { bRightText: 'Pure WebExtension', bLeftText: '⠀', bColor: '570861' },
    "no_limit_experiment": { bRightText: 'Limitless Experiment', bLeftText: '⠀', bColor: 'ff8800' },
    "experiment": { bRightText: 'Experiment (legacy)', bLeftText: '⠀', bColor: 'ff8800' },

    "attachment_api": { bRightText: 'Attachment API Candidate', bLeftText: '⠀', bColor: 'white' },
    "recipientChanged_api": { bRightText: 'onRecipientChanged API', bLeftText: '⠀', bColor: 'white' },

    "incompatible_91": { bRightText: 'Incompatible', bLeftText: 'TB91', bColor: 'c90016' },

    "incompatible_102": { bRightText: 'Incompatible', bLeftText: 'TB102', bColor: 'c90016' },
    "compatible_102": { bRightText: 'Compatible', bLeftText: 'TB102', bColor: 'darkgreen' },

    "compatible_115": { bRightText: 'Compatible', bLeftText: 'TB115', bColor: 'darkgreen' },
    "incompatible_115": { bRightText: 'Incompatible', bLeftText: 'TB115', bColor: 'c90016' },
    "unknown_115": { bRightText: 'Compatibility Unknown', bLeftText: 'TB115', bColor: 'c90016' },
    "column_115": { bRightText: 'Needs Column Support', bLeftText: 'TB115', bColor: 'darkred' },
    "filter_115": { bRightText: 'Needs Custom QuickFilter Support', bLeftText: 'TB115', bColor: 'darkred' },
    "wip_115": { bRightText: 'Work in Progress', bLeftText: 'TB115', bColor: 'yellow' },
    "pr_115": { bRightText: 'Pending Pull Request', bLeftText: 'TB115', bColor: 'green' },
    "investigated_115": { bRightText: 'Ongoing Analysis', bLeftText: 'TB115', bColor: 'orange' },
}

const ignored = [
    "986223", //Thunderbird Addons Test
]

// 102
const knownWorking102 = [
    "987839", //addon/findnow/ - move init code into startup code
    "10052",  //addon/filtaquilla/
    "988234", //addon/tbhints/
    "4454",   //addon/priority-switcher/
    "49594",  //addon/subswitch/
    "161820", //addon/alertswitch/
    "708783", //addon/emojiaddin/ - PR https://github.com/mganss/EmojiAddIn/pull/53
    "116388", //addon/automatic-dictionary-switching/ - content_frame id and multiple spell - https://github.com/beltrachi/automatic_dictionary/issues/56#issuecomment-1162817647
    "1203",   //addon/correct-identity/
    "988115", //addon/clippings-tb/ - content-frame
    "310",    //addon/bidi-mail-ui/ - https://github.com/eyalroz/bidimailui/pull/58/files
    "2610",   //addon/mailbox-alert/ - onItemAdded - onMessageadded and does not remove folderListener
    "988228", //addon/cb_thunderlink/ - can be turned into a pure WebExt - unavailable for a few weeks
    "161710", //addon/more-snooze/
    "287743", //addon/mailhops/
    "987740", //addon/nostalgy_ng/ - https://github.com/opto/nostalgy-xpi/issues/174#issuecomment-1165895633
    "987888", //addon/msghdr-toolbar-customize/ - lots of changes in the header area
    "986643", //addon/filelink-provider-for-webdav/
    "986686", //addon/importexporttools-ng/
    "372603", //addon/enhanced-priority-display/
    "987749", //addon/marked-lightning/
    "988303", //addon/tud-cert-phishing-report/ - getURLSpecFromFile 
    "1392",   //addon/maximize-message-pane/
    "811161", //addon/warnattachment/
    "2299",   //addon/threadkey/ - replace getElementsByClassName("tabmail-tab") by win.document.getElementById("tabmail").currentTabInfo
    "986523", //addon/hide-email-folders/ - could fix a bug for feeds and news
    "46207",  //addon/mailmindr/
    "64758",  //addon/xnotepp/ - PR https://github.com/xnotepp/xnote/pull/95
    "988188", //addon/morelayouts/
    "324497", //addon/smarttemplate4/
    "559954", //addon/tidybird/ - folderUtils.jsm
    "987906", //addon/full-address-column/
    "987840", //addon/printingtools-ng/
    "217293", //addon/signal-spam/
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
    "987986", //addon/select-prev-on-delete/
    "987665", //addon/lefttodaysubpaneorlogoorclock/
    "987945", //addon/treechildrenheight50/
    "987989", //addon/toggle-summary/
    "988086", //addon/confirmconversionsatselecting/
    "1279",   //addon/xpunge/
    "987821", //openattachmentbyextension/
    "986522", //addon/popmaillistrecipients-2/
    "546538", //addon/single-domain/
    "987860", //addon/empty-folder/
    "987892", //addon/quotecolors/
    "330066", //addon/edit-email-subject/

    "704523", //addon/europeanmx/
    "988024", //addon/open-in-browser
    "988038", //addon/archive-old-messages/

    "1556",   //addon/allow-html-temp/
    "902",    //addon/getsendbutton/
    "987885", //addon/tbkeys-lite/
    "986692", //addon/profile-switcher/
    "987775", //addon/search-button/
    "987764", //addon/header-tools-improved/

    "988138", //addon/grammar-and-spell-checker/
    "987934", //addon/simple-mail-redirection/
    "11646",  //addon/no-message-pane-sort-by-mouse/
    "2561",   //addon/copy-sent-to-current/
    "987779", //addon/browseintab/
    "3492",   //addon/show-inout/
    "987933", //addon/toggle-line-wrap/
    "987796", //addon/messagepreview/
    "987979", //addon/attachmentcount/
    "988195", //addon/filter-manager/
    "987902", //addon/deselect-on-delete-tb78/
    "987987", //addon/toggle-html/
    "987857", //addon/preferences-button/
    "987786", //addon/devtools-button/
    "534258", //addon/received/
    "987664", //addon/copy-patch/
    "987976", //addon/findtasksbutton/
    "988260", //addon/x-original-to-column/
    "987844", //addon/insertsignature/
    "2533",   //addon/addressbooks-synchronizer/
    "676875", //addon/rspamd-spamness/
    "47144",  //addon/mail-merge/
    "988108", //addon/openpgp-alias-updater/
    "988289", //addon/keepassxc-mail/
    "988281", //addon/regimail/
];
const knownBroken102 = [
];

// 115
const incompatible115 = [
]

const wip115 = {
    "773590": "John", // TbSync
    "986686": "https://github.com/thundernest/import-export-tools-ng/issues/409", // IETools
    "986258": "John", // Provider for DAV
    "986338": "John", // Provider for Exchange
    "987840": "https://github.com/cleidigh/printing-tools-ng/issues/225", // PrintingTools NG
    "54035": "Standard8",  //Thunderbird Conversations
    "2610": "https://github.com/tjeb/Mailbox-Alert/issues/70", // MailBoxAlert
    "15102": "https://github.com/protz/Manually-Sort-Folders/pull/201", // Manually sort folders
    "331319": "Arnd", // Folder Pane View Switcher
    "988100": "Opto",
    "64758": "Opto",
    "356507": "Opto",
    "988185": "Opto",
    "988001": "Opto",
    "988091": "Opto",
    "987740": "Opto",
    "988392": "Opto",
}

const pr115 = {
    "987986": "https://drive.google.com/file/d/1qXMXsl5jUg-uDsDRxoAFILUM-jjDmhc8/view?usp=sharing", // select_prev_on_delete-2.0.0-tb (google drive)
    "987914": "https://drive.google.com/file/d/14iR0YcJLBRUtdOIj37czTp1p_rO5VCFu/view?usp=sharing", //addon/filter-on-folder-button/ (google drive)
    "605874": "https://github.com/jeevatkm/ReplyWithHeaderMozilla/pull/130", //ReplyWithHeader
    "988096": "https://github.com/thestonehead/ThunderbirdAttachmentExtractor/pull/16", //Attachment Extractor
    "987664": "https://github.com/jan-kiszka/copypatch/pull/1", //Copy Patch
    "327780": "https://github.com/vanowm/TB-Auto-Select-Latest-Message/pull/6", //Auto Select Latest Message
    "988416": "https://github.com/aramir/QuickFilterBy/pull/2", // Quick Filter By
    "852623": "https://github.com/Extended-Thunder/remote-content-by-folder/pull/8", // Remote Content By Folder
    "415184": "https://drive.google.com/file/d/1UeuKj0Rhkp-Pnn-8ofHK9SICP8Q6de9S/view?usp=sharing", //"Needs a full rewrite, like EditEmailSubject", // iOS IMAP Notes - Full rewrite, like edit email subject
    "559954": "https://github.com/ganast/tidybird/pull/95", // Tidybird - CustomUI
}

const investigated = {
    "2548": "https://github.com/thsmi/sieve/issues/893",
}

const column115 = [
    "987838", //addon/sender-domain/
    "987906", //addon/full-address-column/
    "987911", //addon/spam-scores/
    "987915", //addon/mahour-iranian-date/ 
    "195275", //addon/send-later-3/
    "987979", //AttachmentCount
    "690062", //Sender Frequency
    "4454",   //Priority Switcher
    "988392", //Message List Preview
    "988260", //X-Original-To Column
    "988323", //Real sender of italian PEC
    "988411", //Thunvatar
    "372603", //Enhanced Priority Display
    "676875", //Rspamd-spamness
    "3492",   //Show InOut
    "54035",  //Thunderbird Conversations
    "987900", //QNote
    "331666", //QuickArchiver
]

const filter115 = [
    "634298", // CardBook
    "987900", // QNote
]

const recentFoldersAPI = [
    "559954", // TidyBird
]

const attachmentAPI = [
    "988376", //PGP Universal
    "711780", //Lookout Fixed
]

const recipientChanged = [
    "988146", //smartCompose
]

const statusBar = [
    "988115", //addon/clippings-tb/
    "986692", //addon/profile-switcher/
]

// Help for identifying working Experiments without upper limit.
const known115 = [
    "676875", //Rspamd-spamness
    "988230", // "https://drive.google.com/file/d/17IUohmzOcc8ebqpywEWDeZeeAtcPada5/view?usp=sharing", //MetaClean for Thunderbird
    "3254", // "https://github.com/RealRaven2000/QuickFolders/issues/351", //addon/quickfolders-tabbed-folders/
    "987900", //QNote
    "986643", //: "https://github.com/darktrojan/dav/pull/10", //FileLink provider for WebDAV
    "987902", //: "https://github.com/bazuchan/thunderbird-deselect-on-delete/pull/4", //Deselect on Delete TB78
    "787632", //: "https://github.com/hartag/keynav/pull/6", //Quick Folder Key Navigation - it relies on key navigation code of the former xul folderTree, which seems to no longer exist

    "47144",  //addon/mail-merge/
    "988138", //addon/grammar-and-spell-checker/
    "742199", //addon/attach-from-clipboard/
    "11727",  //addon/refwdformatter/ (can be a pure webExt)
    "987865", //addon/previous-colors/
    "360086", //addon/toggle-headers/
    "988057", //addon/keeprunning/
    "987925", //addon/eml-editor/

    "11005", //"https://github.com/memeller/shrunked", // Shrunked Image Resizer
    "987844", // "https://github.com/HiraokaHyperTools/InsertSignature/pull/8", //InsertSignature
    "634298", // CardBook
    "986685", //addon/phoenity-icons/
    "987908", //addon/deepl-selected-text/
    "438634", // DKIM
    "287743", // MailHops
    "407832", //thunderbird/addon/filter-button/
    "987995", //addon/hide-local-folders-for-tb78/ - needs to hide local folders via CSS - contacted
    "987821", //openattachmentbyextension/ - contacted
    "1279",   //addon/xpunge/ - contacted with working version
    "12018",  //addon/quick-folder-move - contacted
    "987729", //: "https://drive.google.com/file/d/11T4wlUYmcpdugYkwpIUNuedEFyr2E7FL/view?usp=sharing", // New Folder Filters Button
    "745576",//: "https://github.com/oheil/logout/pull/1" , //Logout
    "988108",//: "https://drive.google.com/file/d/1HXGqqnPD4Xup6td1CnYrlH0qKDUTP_3O/view?usp=sharing", //addon/openpgp-alias-updater/ - contacted

]

const discontinued = [
    "702920", //addon/thunderhtmledit/
    "219725", //addon/autoslide/
    "986572", //addon/flat-folder-tree-updated/ - broken, core does not seem to support add-on modes anymore -> API
    "987978", //addon/monterail-darkness-extended/ - uses old WL and bad colors in TB91 already
    "987660", //addon/taskviewflexlayout/
    "987928", //addon/tabsinstatusbariconsinmenubar/
    "988198", //addon/dontrestoretabsrevival/
    "988370", //addon/spacebar-clicker/
    "987665", //addon/lefttodaysubpaneorlogoorclock/
    "987945", //addon/treechildrenheight50/
    "367989", //addon/rise-of-the-tools/
    "987901", //addon/transfer-immunity/ - Uses an experiment for alert, uses dead link - https://www.transferimmunity.com/
    "988086", //addon/confirmconversionsatselecting/ - probably discontinued
    "987727", //addon/monterail-full-dark-2/ - probably discontinued
    "987726", //addon/monterail-dark-2-0-for-tb-68/ - probably discontinued
    "987796", //MessagePreview
    "902",    //addon/getsendbutton/
    "986523", //"https://drive.google.com/file/d/17YuLerWVIxsQgmpks1PP26MWXSEJIFGa/view?usp=sharing", //Hide Email Folders

]

const contacted = {
    "988146": "Works, needs max version lift", // smartCompose
    "987925": "Explained how to get it to a pure WebExt, uses deprecated attachment.getFile()", //addon/eml-editor/
    "56935": "Pure WebExt: Use popup AFTER composer opened to select identity",  // Identity Chooser, use popup AFTER composer opened to select identity
    "46207": "Status request, help needed?", // mailmindr - does he need help?
    "988365": "Error: Does not check windowId == -1 on foccus changed", // addon/advanced-composer/ - strangely incompatible - windowId -1 on foccus changed
    "988131": "Still needed after 115 density settings? sunset?", // Larger Message List - Still needed after 115 density settings? sunset ?
    "356507": "Alternative Header Tools Improved?", //Header Tools Lite
    "988214": "Is the new folder key navigation add-on an alternative?", //Filter email folders
}

var gAlternativeData;

var groups = [
    {
        id: "115",
        header: "Thunderbird Supernova reports"
    },
    {
        id: "general",
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
        group: "general",
        header: "All Extensions compatible with TB60 or newer.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let data = getAllData(extJson);
            return { include: !!Object.values(data).find(esr => esr.version) };
        },
    },
    "wrong-order": {
        group: "general",
        header: "Extension with wrong upper limit setting in older versions, which will lead to the wrong version reported compatible by ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v115 = getExtData(extJson, "115").version;
            let v102 = getExtData(extJson, "102").version;
            let v91 = getExtData(extJson, "91").version;
            let v78 = getExtData(extJson, "78").version;
            let v68 = getExtData(extJson, "68").version;
            let v60 = getExtData(extJson, "60").version;

            if (v60 && v68 && compareVer(v60, v68) > 0) return { include: true };
            if (v60 && v78 && compareVer(v60, v78) > 0) return { include: true };
            if (v60 && v91 && compareVer(v60, v91) > 0) return { include: true };
            if (v60 && v102 && compareVer(v60, v102) > 0) return { include: true };
            if (v60 && v115 && compareVer(v60, v115) > 0) return { include: true };

            if (v68 && v78 && compareVer(v68, v78) > 0) return { include: true };
            if (v68 && v91 && compareVer(v68, v91) > 0) return { include: true };
            if (v68 && v102 && compareVer(v68, v102) > 0) return { include: true };
            if (v68 && v115 && compareVer(v68, v115) > 0) return { include: true };

            if (v78 && v91 && compareVer(v78, v91) > 0) return { include: true };
            if (v78 && v102 && compareVer(v78, v102) > 0) return { include: true };
            if (v78 && v115 && compareVer(v78, v115) > 0) return { include: true };

            if (v91 && v102 && compareVer(v91, v102) > 0) return { include: true };
            if (v91 && v115 && compareVer(v91, v115) > 0) return { include: true };

            if (v102 && v115 && compareVer(v102, v115) > 0) return { include: true };

            return { include: false };
        },
    },
    "purge-candidates": {
        group: "general",
        header: "All Extensions not compatible with TB68, which should be purged from ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let data = getAllData(extJson);
            return { include: !Object.entries(data).some(([v, d]) => v > 60 && d.version) };
        },
    },
    "parsing-error": {
        group: "general",
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
        group: "general",
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
    "recent-addition": {
        group: "general",
        header: "Extensions created within the last year.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let current_version = getExtData(extJson, "current").data;
            if (current_version) {
                let c = extJson.created;
                let cv = new Date(c);
                let today = new Date();
                const msDay = 24 * 60 * 60 * 1000;
                let d = (today - cv) / msDay;
                return { include: (d <= 365) };
            }
            return { include: false };
        }
    },
    "requested-permissions": {
        group: "general",
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
    "max-atn-value-raised-above-max-xpi-value": {
        group: "general",
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
            if (discontinued.includes(`${extJson.id}`)) {
                badges.push({ badge: "discontinued" });
            }
            return { include, badges };
        }
    },
    "max-atn-value-reduced-below-max-xpi-value": {
        group: "general",
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
            if (discontinued.includes(`${extJson.id}`)) {
                badges.push({ badge: "discontinued" });
            }
            let themeExperiment = vCurrent.manifest?.theme_experiment;
            if (themeExperiment) {
                badges.push({ badge: "theme_experiment" });
            }
            if (!vCurrent.legacy && vCurrent.mext && !vCurrent.experiment && !themeExperiment) {
                badges.push({ badge: "pure" });
            }

            if (Object.keys(contacted).includes(`${extJson.id}`)) {
                badges.push({ badge: "contacted", tooltip: contacted[`${extJson.id}`] });
            }
            if (Object.keys(wip115).includes(`${extJson.id}`)) {
                badges.push({ badge: "wip_115", link: wip115[extJson.id] });
            }
            if (Object.keys(pr115).includes(`${extJson.id}`)) {
                badges.push({ badge: "pr_115", link: pr115[extJson.id] });
            }
            if (column115.includes(`${extJson.id}`)) {
                badges.push({ badge: "column_115" });
            }
            if (filter115.includes(`${extJson.id}`)) {
                badges.push({ badge: "filter_115" });
            }

            return { include, badges };
        }
    },
    "latest-current-mismatch": {
        group: "general",
        header: "Extensions, where the latest upload is for an older release, which will fail to install in current ESR (current = defined current in ATN) from within the add-on manager.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let data = Object.entries(getAllData(extJson));
            let sorted = data.sort(([a], [b]) => parseInt(a) - parseInt(b));
            let vHighest = sorted.map(([v, d]) => d).filter(d => d.version).pop();
            let vCurrent = getExtData(extJson, "current");
            return { include: !reports["wrong-order"].rowData(extJson).include && !!vHighest && vHighest.version != vCurrent.version };
        },
    },
    // -- v115 -------------------------------------------------------------------------------------
    "tb115-expected-compatible": {
        group: "115",
        header: "Extensions expected to be compatible with Thunderbird 115.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v115 = getExtData(extJson, "115").data;
            let include = !!v115 &&
                !incompatible115.includes(`${extJson.id}`) &&
                !column115.includes(`${extJson.id}`) &&
                !Object.keys(wip115).includes(`${extJson.id}`) &&
                !Object.keys(pr115).includes(`${extJson.id}`) &&
                !discontinued.includes(`${extJson.id}`);
            let badges = [];

            // all non pure extensions have to be explicitly checked
            if (include) {
                if (v115.experiment) {
                    badges.push({ badge: "experiment" });
                }
                let themeExperiment = !!v115 && v115.manifest?.theme_experiment;
                if (themeExperiment) {
                    badges.push({ badge: "theme_experiment" });
                }
                if (!v115.legacy && v115.mext && !v115.experiment && !themeExperiment) {
                    badges.push({ badge: "pure" });
                }
            };

            return { include, badges }
        }
    },
    "lost-tb102-to-tb115-worst-case": {
        group: "115",
        header: "Extensions which have been lost from TB102 to TB115, worst case scenario",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v115 = getExtData(extJson, "115").data;
            let v102 = getExtData(extJson, "102").data;
            let include = (!!v102 && !v115 && !ignored.includes(`${extJson.id}`))
                || incompatible115.includes(`${extJson.id}`)
                || (column115.includes(`${extJson.id}`) && !known115.includes(`${extJson.id}`))
                || Object.keys(wip115).includes(`${extJson.id}`)
                || Object.keys(pr115).includes(`${extJson.id}`)
            let badges = [];

            if (include) {
                if (discontinued.includes(`${extJson.id}`)) {
                    badges.push({ badge: "discontinued" });
                }
                if (incompatible115.includes(`${extJson.id}`)) {
                    badges.push({ badge: "incompatible_115" });
                }
                if (column115.includes(`${extJson.id}`)) {
                    badges.push({ badge: "column_115" });
                }
                if (filter115.includes(`${extJson.id}`)) {
                    badges.push({ badge: "filter_115" });
                }
                if (Object.keys(investigated).includes(`${extJson.id}`)) {
                    badges.push({ badge: "investigated_115", tooltip: investigated[`${extJson.id}`] });
                }
                if (Object.keys(wip115).includes(`${extJson.id}`)) {
                    badges.push({ badge: "wip_115", link: wip115[extJson.id] });
                }
                if (Object.keys(pr115).includes(`${extJson.id}`)) {
                    badges.push({ badge: "pr_115", link: pr115[extJson.id] });
                }
                if (Object.keys(contacted).includes(`${extJson.id}`)) {
                    badges.push({ badge: "contacted", tooltip: contacted[`${extJson.id}`] });
                }

                if (badges.length == 0) {
                    badges.push({ badge: "unknown_115" });
                }

                if (reports["pure-webext-with-upper-limit"].rowData(extJson).include) {
                    badges.push({ badge: "pure", link: "pure-webext-with-upper-limit.html" });
                }
                if (reports["experiments-without-upper-limit"].rowData(extJson).include) {
                    badges.push({ badge: "no_limit_experiment", link: "experiments-without-upper-limit.html" });
                }
                if (attachmentAPI.includes(`${extJson.id}`)) {
                    badges.push({ badge: "attachment_api" });
                }
                if (recipientChanged.includes(`${extJson.id}`)) {
                    badges.push({ badge: "recipientChanged_api" });
                }
                let themeExperiment = v115?.manifest?.theme_experiment;
                if (themeExperiment) {
                    badges.push({ badge: "theme_experiment" });
                }

            }

            return { include, badges };
        }
    },
    "atn-tb115": {
        group: "115",
        header: "Extensions compatible with Thunderbird 115 as seen by ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v115 = getExtData(extJson, "115").data;
            let include = !!v115;
            let badges = [];

            if (include) {
                if (v115.experiment) {
                    badges.push({ badge: "experiment" });
                }
                if (incompatible115.includes(`${extJson.id}`)) {
                    badges.push({ badge: "incompatible_115" });
                }
                if (column115.includes(`${extJson.id}`)) {
                    badges.push({ badge: "column_115" });
                }
                if (filter115.includes(`${extJson.id}`)) {
                    badges.push({ badge: "filter_115" });
                }
                if (Object.keys(investigated).includes(`${extJson.id}`)) {
                    badges.push({ badge: "investigated_115", tooltip: investigated[`${extJson.id}`] });
                }
                if (attachmentAPI.includes(`${extJson.id}`)) {
                    badges.push({ badge: "attachment_api" });
                }
                if (recipientChanged.includes(`${extJson.id}`)) {
                    badges.push({ badge: "recipientChanged_api" });
                }
                if (Object.keys(wip115).includes(`${extJson.id}`)) {
                    badges.push({ badge: "wip_115", link: wip115[extJson.id] });
                }
                if (Object.keys(pr115).includes(`${extJson.id}`)) {
                    badges.push({ badge: "pr_115", link: pr115[extJson.id] });
                }
                if (discontinued.includes(`${extJson.id}`)) {
                    badges.push({ badge: "discontinued" });
                }
                let themeExperiment = v115.manifest?.theme_experiment;
                if (themeExperiment) {
                    badges.push({ badge: "theme_experiment" });
                }
                if (!v115.legacy && v115.mext && !v115.experiment && !themeExperiment) {
                    badges.push({ badge: "pure" });
                }
            };

            return { include, badges }
        }
    },
    "valid-115-according-to-strict-max-but-atn-value-reduced": {
        group: "115",
        header: "Extensions whose strict_max_version allows installation in Thunderbird 115, but ATN value has been lowered to signal incompatibility (which is ignored during install and app upgrade). Also includes add-ons which are known to be incompatible.",
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

            let baseReport = reports["max-atn-value-reduced-below-max-xpi-value"].rowData(extJson);
            let badges = [];
            let manually_lowered = baseReport.include &&
                compareVer(strict_max, 115) > 0 && // xpi limit > 115
                compareVer(atn_max, "115.*") < 0; // atn limit < 115.*

            if (incompatible115.includes(`${extJson.id}`)) {
                badges.push({ badge: "incompatible_115" });
            }

            let themeExperiment = vCurrent.manifest?.theme_experiment;
            if (themeExperiment) {
                badges.push({ badge: "theme_experiment" });
            }
            if (!vCurrent.legacy && vCurrent.mext && !vCurrent.experiment && !themeExperiment) {
                badges.push({ badge: "pure" });
            }
            if (discontinued.includes(`${extJson.id}`)) {
                badges.push({ badge: "discontinued" });
            }

            if (Object.keys(contacted).includes(`${extJson.id}`)) {
                badges.push({ badge: "contacted", tooltip: contacted[`${extJson.id}`] });
            }
            return { include: manually_lowered || incompatible115.includes(`${extJson.id}`), badges };
        }
    },
    "experiments-without-upper-limit": {
        group: "115",
        header: "Experiments without upper limit in ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let vCurrent = getExtData(extJson, "current").data;
            let atn_max = vCurrent?.atn?.compatibility?.thunderbird?.max || "*";
            let atn_min = vCurrent?.atn?.compatibility?.thunderbird?.min || "*";
            let include = !!vCurrent && vCurrent.mext && vCurrent.experiment && atn_max == "*";
            let badges = [];

            if (incompatible115.includes(`${extJson.id}`)) {
                badges.push({ badge: "incompatible_115" });
            }
            if (column115.includes(`${extJson.id}`)) {
                badges.push({ badge: "column_115" });
            }
            if (filter115.includes(`${extJson.id}`)) {
                badges.push({ badge: "filter_115" });
            }
            if (attachmentAPI.includes(`${extJson.id}`)) {
                badges.push({ badge: "attachment_api" });
            }
            if (recipientChanged.includes(`${extJson.id}`)) {
                badges.push({ badge: "recipientChanged_api" });
            }
            if (Object.keys(wip115).includes(`${extJson.id}`)) {
                badges.push({ badge: "wip_115", link: wip115[extJson.id] });
            }
            if (Object.keys(pr115).includes(`${extJson.id}`)) {
                badges.push({ badge: "pr_115", link: pr115[extJson.id] });
            }
            if (known115.includes(`${extJson.id}`)) {
                badges.push({ badge: "compatible_115" });
            }
            if (discontinued.includes(`${extJson.id}`)) {
                badges.push({ badge: "discontinued" });
            }

            return { include, badges };
        }
    },
    "pure-webext-with-upper-limit": {
        group: "115",
        header: "Pure WebExtensions with an unnecessary max_version_setting (excluding theme_experiments).",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let vCurrent = getExtData(extJson, "current").data;
            if (!vCurrent)
                return { include: false };

            let themeExperiment = vCurrent.manifest?.theme_experiment;
            let atn_max = vCurrent?.atn?.compatibility?.thunderbird?.max || "*";
            let strict_max = vCurrent.manifest?.applications?.gecko?.strict_max_version ||
                vCurrent.manifest?.browser_specific_settings?.gecko?.strict_max_version ||
                "*";
            let include = !themeExperiment && !vCurrent.legacy && vCurrent.mext && !vCurrent.experiment && (strict_max != "*" || atn_max != "*");


            let badges = [];
            if (incompatible115.includes(`${extJson.id}`)) {
                badges.push({ badge: "incompatible_115" });
            }
            if (discontinued.includes(`${extJson.id}`)) {
                badges.push({ badge: "discontinued" });
            }
            if (Object.keys(contacted).includes(`${extJson.id}`)) {
                badges.push({ badge: "contacted", tooltip: contacted[`${extJson.id}`] });
            }
            return { include, badges };
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
            let v102 = getExtData(extJson, "102").data;
            let include = !!v102;
            let badges = [];

            if (include) {
                let themeExperiment = v102.manifest?.theme_experiment;
                if (themeExperiment) {
                    badges.push({ badge: "theme_experiment" });
                }
                if (!v102.legacy && v102.mext && !v102.experiment && !themeExperiment) {
                    badges.push({ badge: "pure" });
                }
            }

            return { include, badges };
        }
    },
    "valid-102-according-to-strict-max-but-atn-value-reduced": {
        group: "102",
        header: "Extensions whose strict_max_version allows installation in Thunderbird 102, but ATN value has been lowered to signal incompatibility (which is ignored during install and app upgrade).",
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

            let baseReport = reports["max-atn-value-reduced-below-max-xpi-value"].rowData(extJson);
            let badges = baseReport.badges;
            let include = baseReport.include &&
                compareVer(strict_max, 102) > 0 && // xpi limit > 102
                compareVer(atn_max, "102.*") < 0; // atn limit < 102.*

            if (knownBroken102.includes(`${extJson.id}`)) {
                badges.push({ badge: "incompatible_102" });
            } else if (knownWorking102.includes(`${extJson.id}`)) {
                badges.push({ badge: "compatible_102" });
            }

            if (discontinued.includes(`${extJson.id}`)) {
                badges.push({ badge: "discontinued" });
            }

            if (Object.keys(contacted).includes(`${extJson.id}`)) {
                badges.push({ badge: "contacted", tooltip: contacted[`${extJson.id}`] });
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

            let badges = [];
            if (knownBroken102.includes(`${extJson.id}`)) {
                badges.push({ badge: "incompatible_102" });
            } else if (knownWorking102.includes(`${extJson.id}`)) {
                badges.push({ badge: "compatible_102" });
            } else if (discontinued.includes(`${extJson.id}`)) {
                badges.push({ badge: "discontinued" });
            }

            if (Object.keys(contacted).includes(`${extJson.id}`)) {
                badges.push({ badge: "contacted", tooltip: contacted[`${extJson.id}`] });
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
            let badLimit102 = reports["tb102-experiments-with-102-0-limit"].rowData(extJson).include;
            let include = (!!v91 && !v102) || badLimit102;

            let badges = [];
            if (include) {
                if (getAlternative(extJson)) {
                    badges.push({ badge: "alternative_available" });
                }
                if (knownBroken102.includes(`${extJson.id}`)) {
                    badges.push({ badge: "incompatible_102" });
                } else if (knownWorking102.includes(`${extJson.id}`)) {
                    badges.push({ badge: "compatible_102" });
                } else if (discontinued.includes(`${extJson.id}`)) {
                    badges.push({ badge: "discontinued" });
                }

                if (Object.keys(contacted).includes(`${extJson.id}`)) {
                    badges.push({ badge: "contacted", tooltip: contacted[`${extJson.id}`] });
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
            let v91 = getExtData(extJson, "91").data;
            let include = !!v91;
            let badges = [];

            if (include) {
                let themeExperiment = v91.manifest?.theme_experiment;
                if (themeExperiment) {
                    badges.push({ badge: "theme_experiment" });
                }
                if (!v91.legacy && v91.mext && !v91.experiment && !themeExperiment) {
                    badges.push({ badge: "pure" });
                }
            };

            return { include, badges }
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
                    badges.push({ badge: "incompatible_91" });
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
            let v78 = getExtData(extJson, "78").data;
            let include = !!v78;
            let badges = [];

            if (include) {
                let themeExperiment = v78.manifest?.theme_experiment;
                if (themeExperiment) {
                    badges.push({ badge: "theme_experiment" });
                }
                if (!v78.legacy && v78.mext && !v78.experiment && !themeExperiment) {
                    badges.push({ badge: "pure" });
                }
            };

            return { include, badges }
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
    "false-positives-tb78": {
        group: "78",
        header: "Extensions claiming to be compatible with Thunderbird 78, but are legacy extensions or legacy WebExtensions and therefore unsupported.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let data = getExtData(extJson, "78").data;
            return { include: !!data && data.legacy };
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
            let v68 = getExtData(extJson, "68").data;
            let include = !!v68;
            let badges = [];

            if (include) {
                let themeExperiment = v68.manifest?.theme_experiment;
                if (themeExperiment) {
                    badges.push({ badge: "theme_experiment" });
                }
                if (!v68.legacy && v68.mext && !v68.experiment && !themeExperiment) {
                    badges.push({ badge: "pure" });
                }
            };

            return { include, badges }
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
    "false-positives-tb68": {
        group: "68",
        header: "Extensions claiming to be compatible with Thunderbird 68, but are legacy extensions and therefore unsupported.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let data = getExtData(extJson, "68").data;
            return { include: !!data && data.legacy && !data.mext };
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

                if (data.manifest?.theme_experiment) {
                    rv.push(makeBadgeElement({ bLeftText: 'E', bRightText: 'Theme', bColor: 'blue', bTooltip: "Theme Experiment" }));
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
		  <td style="text-align: right" valign="top">${cv("115")}</td>
		  <td style="text-align: right" valign="top">${current_version?.atn.files[0].created.split('T')[0]}</td>
		  <td style="text-align: right" valign="top">${cv("current")}</td>
		  <td style="text-align: right" valign="top">${v_min}</td>
		  <td style="text-align: right" valign="top">${v_strict_max}</td>
		  <td style="text-align: right" valign="top">${v_max}</td>
		  <td style="text-align: right; font-style: italic" valign="top">${rowData.badges ? rowData.badges.map(e => getBadgeElement(e.badge, e.link, e.tooltip)).join("<br>") : ""}</td>
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

function getBadgeElement(badgeName, bLink, bTooltip) {
    // manipulate bRightText to reuse base bage
    let badgeParts = badgeName.split(".");
    let badgeOpt = badge_definitions[badgeName];
    if (!badgeOpt && Array.isArray(badgeParts) && badge_definitions[badgeParts[0]]) {
        badgeOpt = badge_definitions[badgeParts[0]];
        badgeOpt.bRightText = badgeParts.slice(1).join(".");
    }
    if (bTooltip) {
        badgeOpt.bTooltip = bTooltip;
    }
    return makeBadgeElement(badgeOpt, bLink);
}

function makeBadgeElement(bOpt, bLink) {
    let title = bOpt.bTooltip ? `title='${bOpt.bTooltip}'` : ``;

    let tag = `<img src='https://img.shields.io/badge/${bOpt.bLeftText}-${bOpt.bRightText}-${bOpt.bColor}.svg' ${title}>`
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

function getAllData(extJson) {
    let data = {}
    for (let esr of SUPPORTED_ESR) {
        data[esr] = getExtData(extJson, esr);
    }
    return data;
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
