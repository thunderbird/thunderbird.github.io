/**
 * Extract contribution data from bugzilla.
 * Created by John Bieling
 */

const fs = require('fs-extra');
const reportDir = "../bugzilla-contribution";
const modules = [
    {
        name: "Thunderbird Desktop",
        components: [
            'Thunderbird::Address Book',
            'Thunderbird::Message Reader UI',
            'Thunderbird::Mail Window Front End',
            'Thunderbird::Message Compose Window',
            'Thunderbird::Folder and Message Lists',
            'Thunderbird::Filters',
            'Thunderbird::Security',
            'Thunderbird::OS Integration',
            'Thunderbird::Preferences',
            'Thunderbird::Search',
            'Thunderbird::Toolbars and Tabs',
            'Thunderbird::Installer',
            'Thunderbird::Help Documentation',
            'Thunderbird::FileLink',
            'Thunderbird::Untriaged',
            'Thunderbird::Testing Infrastructure',
            'Thunderbird::Disability Access',
            'Thunderbird::Upstream Synchronization',
            'Thunderbird::L10n'
        ],
        subModules: [
            {
                name: "Addon Support",
                components: [
                    "Thunderbird::Add-Ons: General",
                    "Thunderbird::Add-Ons: Extensions API",
                ]
            },
            {
                name: "Build Config",
                components: [
                    "Thunderbird::Build Config",
                ]
            },
            {
                name: "Instant Messaging",
                components: [
                    "Thunderbird::Instant Messaging",
                ]
            },
            {
                name: "Message Security",
                components: [],
                folders: [
                    "mail/extensions/openpgp/*",
                    "mail/extensions/smime/*",
                ]
            },
            {
                name: "Theme",
                components: [
                    "Thunderbird::Theme",
                ]
            },
            {
                name: "UX (User Experience)",
                components: [
                    "Thunderbird::General"
                ]
            }
        ]
    },
    {
        name: "Calendar",
        components: [
            'Calendar::General',
            'Calendar::Internal Components',
            'Calendar::Import and Export',
            'Calendar::Sunbird Only',
            'Calendar::Preferences',
            'Calendar::Provider: ICS/WebDAV',
            'Calendar::Alarms',
            'Calendar::Lightning Only',
            'Calendar::Dialogs',
            'Calendar::Provider: CalDAV',
            'Calendar::Build Config',
            'Calendar::Printing',
            'Calendar::E-mail based Scheduling (iTIP/iMIP)',
            'Calendar::Provider: WCAP',
            'Calendar::Tasks',
            'Calendar::Website',
            'Calendar::Provider: Local Storage',
            'Calendar::Lightning: SeaMonkey Integration',
            'Calendar::OS Integration',
            'Calendar::Provider: GData',
            'Calendar::ICAL.js Integration',
            'Calendar::Security',
        ],
        subModules: [
            {
                name: "User Interface (UI)",
                components: [
                    "Calendar::Calendar Frontend",
                ]
            },
        ],
    },
    {
        name: "Mail and News Core",
        components: [
            "MailNews Core::Backend",
            "Thunderbird::Account Manager",
            "Thunderbird::Migration",
            "MailNews Core::Account Manager",
            "MailNews Core::Composition",
            "MailNews Core::Filters",
            "MailNews Core::Internationalization",
            "MailNews Core::Movemail",
            "MailNews Core::Networking",
            "MailNews Core::Networking: POP",
            "MailNews Core::Printing",
            "MailNews Core::Profile Migration",
            "MailNews Core::Search",
            "MailNews Core::Security",
            "MailNews Core::Simple MAPI",
            // Were not listed on the council page.
            "MailNews Core::LDAP Integration",
            "MailNews Core::Security: OpenPGP",
            "MailNews Core::XUL Replacements",
            "MailNews Core::Build Config",
            "MailNews Core::General"
        ],
        subModules: [
            {
                name: "Addressbook",
                components: [
                    "MailNews Core::Address Book"
                ]
            },
            {
                name: "Feeds",
                components: [
                    "MailNews Core::Feed Reader"
                ]
            },
            {
                name: "Gloda",
                folders: [
                    "mailnews/db/gloda/"
                ]
            },
            {
                name: "Imap Handling Code",
                components: [
                    "MailNews Core::Networking: IMAP"
                ]
            },
            {
                name: "Import",
                components: [
                    "MailNews Core::Import"
                ]
            },
            {
                name: "Localization",
                components: [
                    "MailNews Core::Localization"
                ]
            },
            {
                name: "MIME Parser",
                components: [
                    "MailNews Core::MIME",
                    "MailNews Core::Attachments"
                ]
            },
            {
                name: "Message Database",
                components: [
                    "MailNews Core::Database"
                ]
            },
            {
                name: "News",
                components: [
                    "MailNews Core::Networking: NNTP"
                ]
            },
            {
                name: "S/MIME",
                components: [
                    "MailNews Core::Security: S/MIME"
                ]
            },
            {
                name: "SMTP",
                components: [
                    "MailNews Core::Networking: SMTP"
                ]
            },
            {
                name: "Unit Testing Infrastructure",
                components: [
                    "MailNews Core::Testing Infrastructure"
                ]
            }
        ]
    }
]

class HTMLBuilder {
    constructor() {
        this.out = "";
    }
    toB64(text) {
        return Buffer.from(text).toString("base64")
    }
    addSection(level, name) {
        this.out += `
  <a id="${this.toB64(name)}"><h${level}>${name}</h${level}></a>`;
    }
    addParagraph(text) {
        this.out += `
  <p>
    ${text}
  <p>`
    }
    addTable(columnNames, rows) {
        this.out += `
  <table class="datatable">
    <thead>
      <tr>
        ${columnNames.map((h, i) => `<th class="${columnNames[i]}">${h}</th>`).join("\n        ")}
      </tr>
    </thead>
    <tbody>
      ${rows.map(r => `<tr>
        ${r.map((c, i) => `<td class="${columnNames[i]}">${c}</td>`).join("\n        ")}
      </tr>`).join("\n      ")}
    </tbody>
  </table>`
    }
    add(raw) {
        this.out += raw;
    }
    getLinkEntry(entry) {
        return `<a href="#${this.toB64(entry)}">${entry}</a>`;
    }
    getList(entries) {
        return `
  <ul>
    ${entries.map(e => `<li>${e}</li>`).join("\n  ")}
  </ul>`
    }

    toString() {
        return `<!DOCTYPE html>
<html lang="en-US">
<head>
  <title>Thunderbird Modules Contribution Matrix</title>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css?family=Roboto|Roboto+Condensed|Roboto+Mono&display=swap');
    @font-face {
        font-family: 'Roboto';
        src: url("https://fonts.googleapis.com/css?family=Roboto:200")
    }
    
    body {
        font-family: 'Roboto' !important;
        font-size: 12px !important;
    }
    ab {
        font-family: "Roboto" !important;
        font-size: 12px !important;
        font-weight: 600 !important;
        text-decoration: underline dotted;
        color: rgb(0, 34, 117);
    }
    p {
        margin:0;
        padding:0;
    }

    .container {
        margin-right: 20px !important;
        margin-left: 20px !important
    }
    
    .datatable {
        width: 100%;
        max-width: 100%;
        margin-bottom: 1rem
    }
    
    .datatable th,
    .datatable td {
        padding: 0.75rem;
        vertical-align: top;
        border-top: 1px solid #eceeef
    }
    
    .datatable thead th {
        vertical-align: bottom;
        border-bottom: 2px solid #eceeef
    }
    
    .datatable tbody+tbody {
        border-top: 2px solid #eceeef
    }
    
    .datatable {
        background-color: #fff
    }
    
    .datatable th,
    .datatable td {
        padding: 0.3rem
    }
    
    .datatable {
        border: 1px solid #eceeef
    }
    
    .datatable th,
    .datatable td {
        border: 1px solid #eceeef
    }
    
    .datatable thead th,
    .datatable thead td {
        border-bottom-width: 2px
    }
    
    .datatable tbody tr:nth-of-type(odd) {
        background-color: rgba(0, 0, 0, 0.05)
    }
    
    
    .datatable {
        border-collapse: collapse
    }
    
    .datatable thead th {
        background-color: #002275;
        color: whitesmoke;
        text-align: left
    }
    
    .datatable .Contributor {
        width: 30em;
    }  
  </style>
</head>
<body>
${this.out}
</body>
</html>`;
    }
}

class DefaultMap extends Map {
    constructor(defaultFunction, entries) {
        super(entries);
        this.default = defaultFunction;
    }

    get(key) {
        if (!this.has(key)) {
            this.set(key, this.default());
        }
        return super.get(key);
    }
}

// Accepts a data obj and increments the specified member by the provided
// incValue, or sets it to the provided incValue, if it does not exist yet.
function incCounter(dataObj, member, incValue = 1) {
    if (!dataObj[member]) {
        dataObj[member] = incValue;
    } else {
        dataObj[member] += incValue;
    }
}


const componentsMap = new DefaultMap(() => new DefaultMap(() => ({})));
function countContribution(component, contributor, contributionType) {
    const counterMap = componentsMap.get(component);
    const counts = counterMap.get(contributor);
    incCounter(counts, "TOTAL");
    incCounter(counts, contributionType);
}

function getContributionTableRows(columns, contributions) {
    // Sort by total.
    contributions.sort((a, b) => {
        if (a[1].TOTAL == b[1].TOTAL) return 0;
        if (a[1].TOTAL < b[1].TOTAL) return 1;
        return -1;
    });

    // Output CSV.
    const rows = [];
    for (const [contributorName, counts] of contributions) {
        const row = [contributorName];
        columns.forEach(e => row.push(counts[e] || "-"));
        rows.push(row);
        // Abort if we have reached low contribution entries.
        if (
            rows.length > 2 &&
            rows[rows.length - 1][1] < 4 &&
            rows[rows.length - 2][1] < 4
        ) {
            break;
        }
    }
    return rows;
}

async function main() {
    if (process.argv.length < 3) {
        console.log(`

Please specify at least one json data file. Use the get_bugzilla_data.js script
to download the required data files from bugzilla.mozilla.org/rest/.

    node bugzilla_report.js data/*

`);
        return;
    }

    // Read the provided data files and count contributions.
    const files = process.argv.slice(2);
    for (let file of files) {
        // split-pop-shift is faster the regexp.
        const json = fs.readJSONSync(file);
        for (const bug of json.bugs) {
            if (!bug.resolution) {
                continue;
            }

            let product = bug.product;
            if (["FIXED", "VERIFIED"].includes(bug.resolution)) {
                // Bugs that have patch work done.
                if (bug.assigned_to == "nobody@mozilla.org") {
                    // Miss-configured bug, ignore.
                    continue;
                }
                countContribution(`${product}::${bug.component}`, bug.assigned_to, "FIXED");
            } else {
                // Bugs that have been triaged.
                for (const history of bug.history) {
                    const changedResolution = history.changes.find(
                        c => c.field_name == "resolution" && c.removed == ""
                    );
                    if (changedResolution) {
                        countContribution(`${product}::${bug.component}`, history.who, changedResolution.added);
                        break;
                    }
                }

            }
        }
    }

    let foundComponents = [...componentsMap].map(e => ({
        componentName: e[0],
        counter: e[1]
    }));

    // Find unassigned components (which need to be fixed in the modules array).
    let unassignedComponents = new Set([...foundComponents.map(e => e.componentName)])
    for (let module of modules) {
        module.components.forEach(e => unassignedComponents.delete(e));
        for (let subModule of module.subModules) {
            if (subModule.components?.length > 0) {
                subModule.components.forEach(e => unassignedComponents.delete(e));
            }
        }
    }
    if (unassignedComponents.size > 0) {
        console.log("Unassigned components found!");
        console.log(unassignedComponents)
    }

    // Find all distinct contribution types.
    const columnSet = new Set();
    for (const { counter } of foundComponents) {
        for (const [name, counts] of counter) {
            Object.keys(counts).forEach((e) => columnSet.add(e));
        }
    }

    // Use the expected TOTAL and FIXED types as first columns, sort all others.
    const columns = [...columnSet].filter(e => !["TOTAL", "FIXED"].includes(e));
    columns.sort();
    columns.unshift("TOTAL", "FIXED");

    // Build report.
    let html = new HTMLBuilder();
    html.addSection(1, "Thunderbird Modules Contribution Matrix");
    html.addParagraph("Contributions to Thunderbird modules since 01.01.2020. Each module lists the contributions for its associated Bugzilla components. These lists are truncated, if more than two low contribution entries (less than 4) have been found.");

    // This section has the components mapped to their modules.
    html.addSection(2, "Modules");
    html.addParagraph("This section lists the contributions to each Module and shows the contributing Bugzilla components.");

    // Module TOC, listing associated components.
    for (let module of modules) {
        let listEntries = [];
        if (module.components?.length > 0) {
            listEntries.push(html.getLinkEntry(`${module.name} Unspecified`) + html.getList(module.components.map(e => html.getLinkEntry(e))));
        }
        for (let subModule of module.subModules) {
            if (subModule.components?.length > 0) {
                listEntries.push(html.getLinkEntry(subModule.name) + html.getList(subModule.components.map(e => html.getLinkEntry(e))));
            } else {
                listEntries.push(html.getLinkEntry(subModule.name) + html.getList(subModule.folders.map(e => html.getLinkEntry(e))));
            }
        }
        html.add(html.getList([
            html.getLinkEntry(module.name) + html.getList(listEntries)
        ]));
    }

    // Table of modules.
    for (let module of modules) {
        html.addSection(3, module.name);

        // Collect the Bugzilla components, which belong to this module.
        let tables = [];
        tables.push({
            name: `${module.name} Unspecified`,
            components: module.components
        })
        module.subModules.forEach(subModule => tables.push({
            name: subModule.name,
            components: subModule.components
        }));
        
        for (const data of tables) {
            html.addSection(4, data.name);
            if (!data.components) {
                html.addParagraph("Missing components data!");
                continue;
            }
    
            // Merge the counts of the collected bugzilla components.
            const moduleMap = new DefaultMap(() => {
                let counter = {}
                columns.forEach(name => counter[name] = 0);
                return counter;
            });

            for (let componentName of data.components) {
                let foundComponent = foundComponents.find(f => f.componentName == componentName);
                if (!foundComponent) {
                    console.log("Failed to find: ",componentName);
                    continue;
                }
                
                for (let [contributor, counts] of foundComponent.counter) {
                    let entry = moduleMap.get(contributor);
                    Object.entries(counts).forEach(count => incCounter(entry, count[0], count[1]))
                }
            }
            
            // Print the table for the module.
            let rows = getContributionTableRows(columns, [...moduleMap]);
            html.addTable(["Contributor", ...columns], rows);
        };
    }

    html.addSection(2, "Bugzilla Components");
    html.addParagraph("This section lists the contributions to each single Bugzilla Component.");

    // Table of components.
    for (const { componentName, counter } of foundComponents) {
        html.addSection(3, componentName);
        
        // Print the table for the component.
        let rows = getContributionTableRows(columns, [...counter]);
        html.addTable(["Contributor", ...columns], rows);
    }

    // Save report.
    fs.ensureDirSync(`${reportDir}`);
    fs.writeFileSync(`${reportDir}/contributions.html`, html.toString());
}

main();
