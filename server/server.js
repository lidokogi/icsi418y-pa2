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
let stories;

async function connectDatabase() {
    try {
        await client.connect();
        const db = client.db("pa2");
        users = db.collection("users");
        projects = db.collection("projects");
        memberships = db.collection("projectmemberships");
        stories = db.collection("userstories");
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

        if (!f_name || !l_name || !username || !password) {
            return res.status(400).json({
                message: "Required information is missing"
            });
        }

        const existing = await users.findOne({ username: username });
        if (existing !== null) {
            return res.status(409).json({
                message: "Username already exists"
            });
        }

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

app.get("/api/users", async (req, res) => {
    try {
        const allUsers = await users.find({}, { projection: { password: 0 } }).toArray();
        res.status(200).json(allUsers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

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

app.get("/api/projects", async (req, res) => {
    try {
        const allProjects = await projects.find({}).toArray();
        res.status(200).json(allProjects);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

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

        const assignedStory = await stories.findOne({ project_id: pId, assigned_user_id: uId });
        if (assignedStory !== null) {
            return res.status(409).json({
                message: "Reassign, unassign, or delete this member's stories before removing them from the project."
            });
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

const priorities = ["High", "Medium", "Low"];
const storyStatuses = ["To Do", "In Progress", "Done"];

async function checkAssignee(pId, assignedUserId) {
    if (assignedUserId === null || assignedUserId === undefined) {
        return { ok: true, id: null };
    }
    if (typeof assignedUserId !== "string" || !ObjectId.isValid(assignedUserId)) {
        return { ok: false, status: 400, message: "Invalid assigned user id" };
    }

    const uId = new ObjectId(assignedUserId);
    const user = await users.findOne({ _id: uId });
    if (user === null) {
        return { ok: false, status: 404, message: "Assigned user does not exist" };
    }

    const membership = await memberships.findOne({ project_id: pId, user_id: uId });
    if (membership === null) {
        return { ok: false, status: 400, message: "Assigned user is not a member of this project" };
    }

    return { ok: true, id: uId };
}

app.get("/api/projects/:projectId/stories", async (req, res) => {
    try {
        const { projectId } = req.params;
        if (!ObjectId.isValid(projectId)) {
            return res.status(400).json({ message: "Invalid project id" });
        }

        const pId = new ObjectId(projectId);
        const project = await projects.findOne({ _id: pId });
        if (project === null) {
            return res.status(404).json({ message: "Project does not exist" });
        }

        const projectStories = await stories.find({ project_id: pId }).toArray();
        res.status(200).json(projectStories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

app.post("/api/projects/:projectId/stories", async (req, res) => {
    try {
        const { projectId } = req.params;
        const { title, description, priority, assigned_user_id } = req.body;

        if (!ObjectId.isValid(projectId)) {
            return res.status(400).json({ message: "Invalid project id" });
        }

        const pId = new ObjectId(projectId);
        const project = await projects.findOne({ _id: pId });
        if (project === null) {
            return res.status(404).json({ message: "Project does not exist" });
        }

        if (typeof title !== "string" || typeof description !== "string" ||
            title.trim() === "" || description.trim() === "") {
            return res.status(400).json({ message: "Title and description are required" });
        }
        if (!priorities.includes(priority)) {
            return res.status(400).json({ message: "Invalid priority" });
        }

        const assignee = await checkAssignee(pId, assigned_user_id);
        if (!assignee.ok) {
            return res.status(assignee.status).json({ message: assignee.message });
        }

        await stories.insertOne({
            project_id: pId,
            title: title.trim(),
            description: description.trim(),
            priority: priority,
            status: "To Do",
            assigned_user_id: assignee.id
        });

        res.status(201).json({ message: "Story created successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

app.put("/api/projects/:projectId/stories/:storyId", async (req, res) => {
    try {
        const { projectId, storyId } = req.params;
        const { title, description, priority, status, assigned_user_id } = req.body;

        if (!ObjectId.isValid(projectId) || !ObjectId.isValid(storyId)) {
            return res.status(400).json({ message: "Invalid id" });
        }

        const pId = new ObjectId(projectId);
        const sId = new ObjectId(storyId);

        const project = await projects.findOne({ _id: pId });
        if (project === null) {
            return res.status(404).json({ message: "Project does not exist" });
        }

        if (typeof title !== "string" || typeof description !== "string" ||
            title.trim() === "" || description.trim() === "") {
            return res.status(400).json({ message: "Title and description are required" });
        }
        if (!priorities.includes(priority)) {
            return res.status(400).json({ message: "Invalid priority" });
        }
        if (!storyStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const assignee = await checkAssignee(pId, assigned_user_id);
        if (!assignee.ok) {
            return res.status(assignee.status).json({ message: assignee.message });
        }

        const result = await stories.updateOne(
            { _id: sId, project_id: pId },
            {
                $set: {
                    title: title.trim(),
                    description: description.trim(),
                    priority: priority,
                    status: status,
                    assigned_user_id: assignee.id
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Story does not exist in this project" });
        }

        res.status(200).json({ message: "Story updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

app.delete("/api/projects/:projectId/stories/:storyId", async (req, res) => {
    try {
        const { projectId, storyId } = req.params;

        if (!ObjectId.isValid(projectId) || !ObjectId.isValid(storyId)) {
            return res.status(400).json({ message: "Invalid id" });
        }

        const result = await stories.deleteOne({
            _id: new ObjectId(storyId),
            project_id: new ObjectId(projectId)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Story does not exist in this project" });
        }

        res.status(200).json({ message: "Story deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

app.listen(9000, () => {
    console.log("Server running on port 9000");
});