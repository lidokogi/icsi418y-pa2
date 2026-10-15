require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
app.use(express.json());
app.use(cors());

const client = new MongoClient(process.env.MONGO_URI);
let users;
let projects;
let memberships;

async function connectDatabase() {
    try {
        await client.connect();
        users = client.db("pa2").collection("users");
        projects = client.db("pa2").collection("projects");
        memberships = client.db("pa2").collection("projectmemberships");
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

// get all users (without passwords)
app.get("/api/users", async (req, res) => {
    try {
        const allUsers = await users.find({}, { projection: { password: 0 } }).toArray();
        res.status(200).json(allUsers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// create a project
app.post("/api/projects", async (req, res) => {
    try {
        const { name, description, status, project_lead_id } = req.body;

        if (!name || !description || !status || !project_lead_id) {
            return res.status(400).json({ message: "Required information is missing" });
        }

        if (status !== "Planning" && status !== "Active" && status !== "Completed") {
            return res.status(400).json({ message: "Invalid status" });
        }

        if (!ObjectId.isValid(project_lead_id)) {
            return res.status(400).json({ message: "Invalid project lead id" });
        }

        const leadId = new ObjectId(project_lead_id);
        const lead = await users.findOne({ _id: leadId });
        if (lead === null) {
            return res.status(404).json({ message: "Project lead does not exist" });
        }

        const result = await projects.insertOne({
            name: name,
            description: description,
            status: status,
            project_lead_id: leadId
        });

        // the lead is also a member
        await memberships.insertOne({
            project_id: result.insertedId,
            user_id: leadId
        });

        res.status(201).json({ message: "Project created successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// get all projects
app.get("/api/projects", async (req, res) => {
    try {
        const allProjects = await projects.find({}).toArray();
        res.status(200).json(allProjects);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// get members of one project
app.get("/api/projects/:projectId/members", async (req, res) => {
    try {
        const { projectId } = req.params;

        if (!ObjectId.isValid(projectId)) {
            return res.status(400).json({ message: "Invalid project id" });
        }

        const project = await projects.findOne({ _id: new ObjectId(projectId) });
        if (project === null) {
            return res.status(404).json({ message: "Project does not exist" });
        }

        const members = await memberships.find({ project_id: new ObjectId(projectId) }).toArray();
        res.status(200).json(members);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// add a member
app.post("/api/projects/:projectId/members", async (req, res) => {
    try {
        const { projectId } = req.params;
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({ message: "Please select a user" });
        }
        if (!ObjectId.isValid(projectId) || !ObjectId.isValid(user_id)) {
            return res.status(400).json({ message: "Invalid id" });
        }

        const pId = new ObjectId(projectId);
        const uId = new ObjectId(user_id);

        const project = await projects.findOne({ _id: pId });
        if (project === null) {
            return res.status(404).json({ message: "Project does not exist" });
        }

        const user = await users.findOne({ _id: uId });
        if (user === null) {
            return res.status(404).json({ message: "User does not exist" });
        }

        const existing = await memberships.findOne({ project_id: pId, user_id: uId });
        if (existing !== null) {
            return res.status(409).json({ message: "User is already a member of this project." });
        }

        await memberships.insertOne({ project_id: pId, user_id: uId });
        res.status(201).json({ message: "Member added successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// remove a member
app.delete("/api/projects/:projectId/members/:userId", async (req, res) => {
    try {
        const { projectId, userId } = req.params;

        if (!ObjectId.isValid(projectId) || !ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid id" });
        }

        const pId = new ObjectId(projectId);
        const uId = new ObjectId(userId);

        const project = await projects.findOne({ _id: pId });
        if (project === null) {
            return res.status(404).json({ message: "Project does not exist" });
        }

        if (project.project_lead_id.toString() === userId) {
            return res.status(400).json({ message: "The project lead cannot be removed." });
        }

        const result = await memberships.deleteOne({ project_id: pId, user_id: uId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "That user is not a member of this project" });
        }

        res.status(200).json({ message: "Member removed successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

app.listen(9000, () => {
    console.log("Server running on port 9000");
});