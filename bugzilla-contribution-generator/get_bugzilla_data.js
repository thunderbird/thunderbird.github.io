const fs = require('fs-extra');
const bent = require('bent');
const bentGetJSON = bent('GET', 'json', 200);

function makeUrl({ limit, offset, last_change_time, product }) {
    return `https://bugzilla.mozilla.org/rest/bug?limit=${limit}&offset=${offset}&include_fields=product,component,id,summary,last_change_time,history,resolution,assigned_to&last_change_time=${last_change_time}&product=${product}`;
}

async function getData({ product, last_change_time, max_entries }) {
    // Request chunks until we do not get anything back.
    let limit = 1000;
    let offset = 0;
    let data = [];
    console.log(`Requesting data from bugzilla.mozilla.org/rest/`);
    console.log(`===============================================`);
    console.log(`  product: ${product}`);
    console.log(`  last_change_time: ${last_change_time}`);
    console.log(`  max_entries: ${max_entries}`);
    console.log(`===============================================`);

    do {
        console.log(`Reading at offset: ${offset}`);
        let url = makeUrl({
            limit,
            offset,
            last_change_time,
            product
        });
        let { bugs } = await bentGetJSON(url)
            .catch(err => {
                console.error("Error in request", err);
                return null;
            });

        if (bugs.length == 0) {
            break;
        }

        for (let entry of bugs) {
            data.push(entry)
        }
        offset += limit;
    } while (max_entries == 0 || max_entries > offset);
    return data;
}

async function writePrettyJSONFile(f, json) {
    try {
        return await fs.outputFile(f, JSON.stringify(json, null, 4));
    } catch (err) {
        console.error("Error in writePrettyJSONFile()", f, err);
        throw err;
    }
}

async function main() {
    if (process.argv.length < 4) {
        console.log(`

Please specify at least the product and the last_change_time for your request.

    node get_bugzilla_data.js "Thunderbird" "2020-01-01" <max entries>

`);
        return;
    }

    const [product, last_change_time, max_entries] = process.argv.slice(2);

    let data = await getData({
        product,
        last_change_time,
        max_entries: max_entries ? parseInt(max_entries, 10) : 0
    })
    await writePrettyJSONFile(`data/${product}.json`, { bugs: data });
}

main();