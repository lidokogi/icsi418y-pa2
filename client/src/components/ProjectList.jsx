import { useState, useEffect } from "react";

function ProjectList() {
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
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

    // turn the lead's id into a readable name
    function getLeadName(leadId) {
        const lead = users.find((user) => user._id === leadId);
        if (lead) {
            return lead.f_name + " " + lead.l_name + " (" + lead.username + ")";
        }
        return "Unknown";
    }

    return (
        <div>
            <h2>Projects</h2>
            {message && <p>{message}</p>}
            {projects.length === 0 && <p>No projects yet.</p>}
            {projects.map((project) => (
                <div key={project._id}>
                    <h3>{project.name}</h3>
                    <p>Description: {project.description}</p>
                    <p>Status: {project.status}</p>
                    <p>Project Lead: {getLeadName(project.project_lead_id)}</p>
                    <hr />
                </div>
            ))}
        </div>
    );
}

export default ProjectList;