require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
app.use(express.json());
app.use(cors());

const client = new MongoClient(process.env.MONGO_URI);
let users;

async function connectDatabase() {
    try {
        await client.connect();
        users = client.db("pa2").collection("users");
        // makes MongoDB itself refuse duplicate usernames
        await users.createIndex({ username: 1 }, { unique: true });
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Could not connect to MongoDB");
        console.error(error);
    }
}
connectDatabase();

app.post("/signup", async (req, res) => {
    try {
        const { f_name, l_name, username, password } = req.body;

        // check required fields
        if (!f_name || !l_name || !username || !password) {
            return res.status(400).json({
                message: "Required information is missing"
            });
        }

        // check for an existing username
        const existing = await users.findOne({ username: username });
        if (existing !== null) {
            return res.status(409).json({
                message: "Username already exists"
            });
        }

        // create the user (MongoDB makes _id for us)
        await users.insertOne({
            f_name: f_name,
            l_name: l_name,
            username: username,
            password: password
        });

        res.status(201).json({
            message: "User created successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Required information is missing"
            });
        }

        const user = await users.findOne({ username: username });
        if (user === null) {
            return res.status(401).json({
                message: "Username does not exist"
            });
        }

        if (user.password !== password) {
            return res.status(401).json({
                message: "Incorrect password"
            });
        }

        res.status(200).json({
            message: "Login successful. Welcome, " + user.f_name + "!"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

app.listen(9000, () => {
    console.log("Server running on port 9000");
});