import { useState, useEffect } from "react";

function ProjectMembers() {
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [projectId, setProjectId] = useState("");
    const [members, setMembers] = useState([]);
    const [newUserId, setNewUserId] = useState("");
    const [message, setMessage] = useState("");

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

    async function loadMembers(id) {
        try {
            const response = await fetch("http://localhost:9000/api/projects/" + id + "/members");
            const data = await response.json();
            if (response.ok) {
                setMembers(data);
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            setMessage("Could not connect to the server");
        }
    }

    function handleProjectChange(event) {
        const id = event.target.value;
        setProjectId(id);
        setMessage("");
        if (id === "") {
            setMembers([]);
        } else {
            loadMembers(id);
        }
    }

    async function handleAdd() {
        try {
            const response = await fetch("http://localhost:9000/api/projects/" + projectId + "/members", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ user_id: newUserId })
            });

            const data = await response.json();
            setMessage(data.message);

            if (response.ok) {
                setNewUserId("");
                loadMembers(projectId); // refresh the list
            }
        } catch (error) {
            setMessage("Could not connect to the server");
        }
    }

    async function handleRemove(userId) {
        try {
            const response = await fetch(
                "http://localhost:9000/api/projects/" + projectId + "/members/" + userId,
                { method: "DELETE" }
            );

            const data = await response.json();
            setMessage(data.message);

            if (response.ok) {
                loadMembers(projectId); // refresh the list
            }
        } catch (error) {
            setMessage("Could not connect to the server");
        }
    }

    function getUserName(userId) {
        const user = users.find((u) => u._id === userId);
        if (user) {
            return user.f_name + " " + user.l_name + " (" + user.username + ")";
        }
        return "Unknown";
    }

    const selectedProject = projects.find((p) => p._id === projectId);

    return (
        <div>
            <h2>Manage Project Members</h2>

            <select value={projectId} onChange={handleProjectChange}>
                <option value="">Select a project</option>
                {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                        {project.name}
                    </option>
                ))}
            </select>

            {projectId !== "" && (
                <div>
                    <h3>Members</h3>
                    {members.map((member) => (
                        <p key={member._id}>
                            {getUserName(member.user_id)}
                            {selectedProject && member.user_id === selectedProject.project_lead_id ? (
                                " - Project Lead"
                            ) : (
                                <button onClick={() => handleRemove(member.user_id)}>Remove</button>
                            )}
                        </p>
                    ))}

                    <h3>Add Member</h3>
                    <select value={newUserId} onChange={(event) => setNewUserId(event.target.value)}>
                        <option value="">Select a user</option>
                        {users.map((user) => (
                            <option key={user._id} value={user._id}>
                                {user.f_name} {user.l_name} ({user.username})
                            </option>
                        ))}
                    </select>
                    <button onClick={handleAdd}>Add</button>
                </div>
            )}

            {message && <p>{message}</p>}
        </div>
    );
}

export default ProjectMembers;