import { useState } from "react";

function Signup() {
    const [fName, setFName] = useState("");
    const [lName, setLName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            const response = await fetch("http://localhost:9000/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    f_name: fName,
                    l_name: lName,
                    username: username,
                    password: password
                })
            });

            const data = await response.json();
            setMessage(data.message);

            if (response.ok) {
                setFName("");
                setLName("");
                setUsername("");
                setPassword("");
            }
        } catch (error) {
            setMessage("Could not connect to the server");
        }
    }

    return (
        <div>
            <h2>Sign Up</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="First Name" value={fName}
                    onChange={(event) => setFName(event.target.value)} />
                <br />
                <input type="text" placeholder="Last Name" value={lName}
                    onChange={(event) => setLName(event.target.value)} />
                <br />
                <input type="text" placeholder="Username" value={username}
                    onChange={(event) => setUsername(event.target.value)} />
                <br />
                <input type="password" placeholder="Password" value={password}
                    onChange={(event) => setPassword(event.target.value)} />
                <br />
                <button type="submit">Sign Up</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
}

export default Signup;