const express = require("express");
const app = express();
app.use(express.static('public'));
const http = require("http").createServer(app);

http.listen(80, () => {
    console.log("listening on *:80");
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/clouds.html");
});