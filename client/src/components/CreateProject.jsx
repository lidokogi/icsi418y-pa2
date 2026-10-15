import { useState, useEffect } from "react";

function CreateProject() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("Planning");
    const [leadId, setLeadId] = useState("");
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState("");

    // load the users when the page opens
    useEffect(() => {
        async function loadUsers() {
            try {
                const response = await fetch("http://localhost:9000/api/users");
                const data = await response.json();
                setUsers(data);
            } catch (error) {
                setMessage("Could not connect to the server");
            }
        }
        loadUsers();
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            const response = await fetch("http://localhost:9000/api/projects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name,
                    description: description,
                    status: status,
                    project_lead_id: leadId
                })
            });

            const data = await response.json();
            setMessage(data.message);

            if (response.ok) {
                setName("");
                setDescription("");
                setStatus("Planning");
                setLeadId("");
            }
        } catch (error) {
            setMessage("Could not connect to the server");
        }
    }

    return (
        <div>
            <h2>Create Project</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Project Name" value={name}
                    onChange={(event) => setName(event.target.value)} />
                <br />
                <input type="text" placeholder="Description" value={description}
                    onChange={(event) => setDescription(event.target.value)} />
                <br />
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="Planning">Planning</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                </select>
                <br />
                <select value={leadId} onChange={(event) => setLeadId(event.target.value)}>
                    <option value="">Select Project Lead</option>
                    {users.map((user) => (
                        <option key={user._id} value={user._id}>
                            {user.f_name} {user.l_name} ({user.username})
                        </option>
                    ))}
                </select>
                <br />
                <button type="submit">Create Project</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
}

export default CreateProject;