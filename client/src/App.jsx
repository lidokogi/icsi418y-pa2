import { useState } from "react";
import Login from "./components/Login";
import Signup from "./components/Signup";
import CreateProject from "./components/CreateProject";
import ProjectList from "./components/ProjectList";
import ProjectMembers from "./components/ProjectMembers";
import Backlog from "./components/Backlog";

function App() {
  const [page, setPage] = useState("signup");

  return (
    <div>
      <button onClick={() => setPage("signup")}>Signup</button>
      <button onClick={() => setPage("login")}>Login</button>
      <button onClick={() => setPage("create")}>Create Project</button>
      <button onClick={() => setPage("projects")}>Projects</button>
      <button onClick={() => setPage("members")}>Members</button>
      <button onClick={() => setPage("backlog")}>Backlog</button>

      {page === "signup" && <Signup />}
      {page === "login" && <Login />}
      {page === "create" && <CreateProject />}
      {page === "projects" && <ProjectList />}
      {page === "members" && <ProjectMembers />}
      {page === "backlog" && <Backlog />}
    </div>
  );
}

export default App;