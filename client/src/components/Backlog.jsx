import { useState, useEffect } from "react";

function Backlog() {
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [projectId, setProjectId] = useState("");
    const [members, setMembers] = useState([]);
    const [stories, setStories] = useState([]);
    const [message, setMessage] = useState("");

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("Medium");
    const [assignedId, setAssignedId] = useState("");

    const [openId, setOpenId] = useState("");
    const [editingId, setEditingId] = useState("");
    const [editData, setEditData] = useState({
        title: "",
        description: "",
        priority: "Medium",
        status: "To Do",
        assigned: ""
    });

    useEffect(() => {
        async function loadData() {
            try {
                const projectResponse = await fetch("http://localhost:9000/api/projects");
                const userResponse = await fetch("http://localhost:9000/api/users");
                setProjects(await projectResponse.json());
                setUsers(await userResponse.json());
            } catch (error) {
                setMessage("Could not connect to the server");
            }
        }
        loadData();
    }, []);

    useEffect(() => {
        setMembers([]);
        setStories([]);
        setOpenId("");
        setEditingId("");
        setMessage("");

        if (projectId === "") {
            return;
        }

        let ignore = false;

        async function loadProject() {
            try {
                const memberResponse = await fetch("http://localhost:9000/api/projects/" + projectId + "/members");
                const storyResponse = await fetch("http://localhost:9000/api/projects/" + projectId + "/stories");
                const memberData = await memberResponse.json();
                const storyData = await storyResponse.json();

                if (ignore) {
                    return;
                }
                if (memberResponse.ok && storyResponse.ok) {
                    setMembers(memberData);
                    setStories(storyData);
                } else {
                    setMessage("Could not load this project");
                }
            } catch (error) {
                if (!ignore) {
                    setMessage("Could not connect to the server");
                }
            }
        }
        loadProject();

        return () => {
            ignore = true;
        };
    }, [projectId]);

    async function loadStories() {
        try {
            const response = await fetch("http://localhost:9000/api/projects/" + projectId + "/stories");
            const data = await response.json();
            if (response.ok) {
                setStories(data);
            }
        } catch (error) {
            setMessage("Could not connect to the server");
        }
    }

    function getUserName(userId) {
        if (userId === null) {
            return "Unassigned";
        }
        const user = users.find((u) => u._id === userId);
        if (user) {
            return user.f_name + " " + user.l_name + " (" + user.username + ")";
        }
        return "Unknown";
    }

    async function handleCreate(event) {
        event.preventDefault();

        try {
            const response = await fetch("http://localhost:9000/api/projects/" + projectId + "/stories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title: title,
                    description: description,
                    priority: priority,
                    assigned_user_id: assignedId === "" ? null : assignedId
                })
            });

            const data = await response.json();
            setMessage(data.message);

            if (response.ok) {
                setTitle("");
                setDescription("");
                setPriority("Medium");
                setAssignedId("");
                loadStories();
            }
        } catch (error) {
            setMessage("Could not connect to the server");
        }
    }

    function startEdit(story) {
        setEditingId(story._id);
        setMessage("");
        setEditData({
            title: story.title,
            description: story.description,
            priority: story.priority,
            status: story.status,
            assigned: story.assigned_user_id === null ? "" : story.assigned_user_id
        });
    }

    function handleEditChange(event) {
        setEditData({ ...editData, [event.target.name]: event.target.value });
    }

    async function handleSave(event) {
        event.preventDefault();

        try {
            const response = await fetch(
                "http://localhost:9000/api/projects/" + projectId + "/stories/" + editingId,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        title: editData.title,
                        description: editData.description,
                        priority: editData.priority,
                        status: editData.status,
                        assigned_user_id: editData.assigned === "" ? null : editData.assigned
                    })
                }
            );

            const data = await response.json();
            setMessage(data.message);

            if (response.ok) {
                setEditingId("");
                loadStories();
            }
        } catch (error) {
            setMessage("Could not connect to the server");
        }
    }

    async function handleDelete(storyId) {
        if (!window.confirm("Are you sure you want to delete this story?")) {
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:9000/api/projects/" + projectId + "/stories/" + storyId,
                { method: "DELETE" }
            );

            const data = await response.json();
            setMessage(data.message);

            if (response.ok) {
                setOpenId("");
                setEditingId("");
                loadStories();
            }
        } catch (error) {
            setMessage("Could not connect to the server");
        }
    }

    return (
        <div>
            <h2>Project Backlog</h2>

            <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
                <option value="">Select a project</option>
                {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                        {project.name}
                    </option>
                ))}
            </select>

            {projectId !== "" && (
                <div>
                    <h3>Create Story</h3>
                    <form onSubmit={handleCreate}>
                        <input type="text" placeholder="Title" value={title}
                            onChange={(event) => setTitle(event.target.value)} />
                        <br />
                        <textarea placeholder="As a [user], I want [goal], so that [benefit]."
                            value={description}
                            onChange={(event) => setDescription(event.target.value)} />
                        <br />
                        <select value={priority} onChange={(event) => setPriority(event.target.value)}>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                        <select value={assignedId} onChange={(event) => setAssignedId(event.target.value)}>
                            <option value="">Unassigned</option>
                            {members.map((member) => (
                                <option key={member._id} value={member.user_id}>
                                    {getUserName(member.user_id)}
                                </option>
                            ))}
                        </select>
                        <br />
                        <button type="submit">Add Story</button>
                    </form>

                    <h3>Stories</h3>
                    {stories.length === 0 && <p>This project has no stories yet.</p>}
                    {stories.map((story) => (
                        <div key={story._id}>
                            <p>
                                <b>{story.title}</b> | Priority: {story.priority} | Status: {story.status} | Assigned: {getUserName(story.assigned_user_id)}
                            </p>
                            <button onClick={() => setOpenId(openId === story._id ? "" : story._id)}>
                                Details
                            </button>
                            <button onClick={() => startEdit(story)}>Edit</button>
                            <button onClick={() => handleDelete(story._id)}>Delete</button>

                            {openId === story._id && <p>{story.description}</p>}

                            {editingId === story._id && (
                                <form onSubmit={handleSave}>
                                    <input type="text" name="title" value={editData.title}
                                        onChange={handleEditChange} />
                                    <br />
                                    <textarea name="description" value={editData.description}
                                        onChange={handleEditChange} />
                                    <br />
                                    <select name="priority" value={editData.priority} onChange={handleEditChange}>
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                    <select name="status" value={editData.status} onChange={handleEditChange}>
                                        <option value="To Do">To Do</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Done">Done</option>
                                    </select>
                                    <select name="assigned" value={editData.assigned} onChange={handleEditChange}>
                                        <option value="">Unassigned</option>
                                        {members.map((member) => (
                                            <option key={member._id} value={member.user_id}>
                                                {getUserName(member.user_id)}
                                            </option>
                                        ))}
                                    </select>
                                    <br />
                                    <button type="submit">Save</button>
                                    <button type="button" onClick={() => setEditingId("")}>Cancel</button>
                                </form>
                            )}
                            <hr />
                        </div>
                    ))}
                </div>
            )}

            {message && <p>{message}</p>}
        </div>
    );
}

export default Backlog;