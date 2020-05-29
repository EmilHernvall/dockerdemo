const express = require("express");
const { Pool } = require("pg");

const pool = new Pool({
  user: 'catpics',
  host: 'catpicdb',
  database: 'catpics',
  password: 'catpics',
  port: 5432,
});

const app = express();

app.get("/", async (req, res) => {
    const query = "SELECT catpicture_id, catpicture_title, catpicture_user "+
        "FROM catpicture " +
        "ORDER BY catpicture_timestamp DESC";

    const { rows } = await pool.query(query);

    const content = rows.map((row) => `
        <tr>
            <td>${row.catpicture_title}</td>
            <td>${row.catpicture_user}</td>
            <td><a href="/image/${row.catpicture_id}"><img src="/image/${row.catpicture_id}" style="max-height: 200px; max-width: 200px;" /></a></td>
        </tr>
        `).join("\n")

    const template = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Catpics</title>
    </head>
    <body>
        <h1>Catpics</h1>

        <table>
        ${content}
        </table>
    </body>
    </html>
    `;

    res.send(template);
});

app.get("/image/:id", async (req, res) => {
    const query = "SELECT catpicture_data "+
        "FROM catpicture " +
        "WHERE catpicture_id = $1";

    const { rows } = await pool.query(query, [req.params.id]);
    if (rows.length == 0) {
        res.status(404).send("Not found");
        return;
    }

    res.set("content-type", "image/jpeg").send(rows[0].catpicture_data);
});


app.listen(5000, () => console.log("Server started"));
