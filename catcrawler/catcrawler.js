const { Pool, Client } = require('pg')
const fetch = require("node-fetch");
const { promisify } = require("util");

const pool = new Pool({
  user: 'catpics',
  host: 'catpicdb',
  database: 'catpics',
  password: 'catpics',
  port: 5432,
});

async function main() {
    console.log("Downloading fresh catpictures");

    const response = await fetch("https://www.reddit.com/r/catpictures.json");
    const result = await response.json();
    const children = result.data.children;
    for (const child of children) {
        const { url, id, title, author } = child.data;
        if (!url.endsWith(".jpg")) {
            continue;
        }

        const components = url.split("/");
        const filename = "catpictures/" + components.pop();

        const dupcheck = "SELECT * FROM catpicture WHERE catpicture_redditid = $1";

        const { rows } = await pool.query(dupcheck, [id]);
        if (rows.length > 0) {
            console.log("Skipping " + url);
            continue;
        }

        console.log("Downloading " + url);
        const imageResponse = await fetch(url);
        const imageData = await imageResponse.buffer();

        const insert = "INSERT INTO catpicture (catpicture_redditid, " +
            "catpicture_title, catpicture_user, catpicture_data) " +
            "VALUES ($1, $2, $3, $4)";

        await pool.query(insert, [
            id,
            title,
            author,
            imageData,
        ]);
    }

    console.log("Done, waiting...");

    setTimeout(main, 60*1000);
}

main();
