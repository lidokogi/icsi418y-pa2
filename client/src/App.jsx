import { useState } from "react";
import Login from "./components/Login";
import Signup from "./components/Signup";

function App() {
  const [page, setPage] = useState("signup");

  return (
    <div>
      <button onClick={() => setPage("signup")}>Signup</button>
      <button onClick={() => setPage("login")}>Login</button>

      {page === "signup" ? <Signup /> : <Login />}
    </div>
  );
}

export default App;