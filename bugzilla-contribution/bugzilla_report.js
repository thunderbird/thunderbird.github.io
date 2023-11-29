/**
 * Extract contribution data from bugzilla.
 * Created by John Bieling
 */

const fs = require('fs-extra');
let components = new Map();

function countMe(component, contributor) {
    let counter = components.get(component) || new Map();
    let counts = counter.get(contributor) || 0;
    counts++;
    counter.set(contributor, counts);
    components.set(component, counter);
}

async function main() {
    if (process.argv.length != 3) {
        console.log(`

Please specify a json file retrieved from the Bugzilla REST API, which should be analyzed.

A REST API call to generate such a file could look like so:
https://bugzilla.mozilla.org/rest/bug?limit=10000&offset=20000&include_fields=product,component,id,summary,last_change_time,history,resolution,assigned_to&last_change_time=2020-01-01&product=Thunderbird

`);
        return;
    }

    let file = process.argv[2];
    let json = fs.readJSONSync(file);
    for (let bug of json.bugs) {
        if (!bug.resolution) {
            continue;
        }

        if (["FIXED", "VERIFIED"].includes(bug.resolution)) {
            // Bugs that have patch work done.
            if (bug.assigned_to == "nobody@mozilla.org") {
                // miss-configured bug, ignore
                continue;
            }
            countMe(bug.component, bug.assigned_to);
        } else {
            // Bugs that have been triaged.
            for (let history of bug.history) {
                let changedResolution = history.changes.find(
                    c => c.field_name == "resolution" && c.removed == ""
                );
                if (changedResolution) {
                    countMe(bug.component, history.who);
                    break;
                }
            }

        }
    }
    
    for (let [component, counter] of components) {
        console.log(component);
        console.log("================================================================================");
        let rv = [...counter];
        rv.sort((a,b) => {
            if (a[1] == b[1]) return 0; 
            if (a[1] < b[1]) return 1;
            return -1;
        });
        for (let e of rv) {
            console.log(`${e[0]}; ${e[1]}`);
        }
        console.log("\n");
    }
}

main();
