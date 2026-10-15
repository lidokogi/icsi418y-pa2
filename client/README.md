# ICSI 418Y Programming Assignment 3

Full-stack app with React, Express, and MongoDB. Users can sign up, log in, create projects, and manage project members.

## Running the app

You need Node.js and a MongoDB Atlas cluster.

**Backend**

```
cd server
npm install
```

Create a `.env` file in the `server` folder:

```
MONGO_URI=your_connection_string_here
```

Make sure your IP is allowed in Atlas under Network Access, then start the server:

```
node server.js
```

It should print "Server running on port 9000" and "Connected to MongoDB".

**Frontend**

In a second terminal:

```
cd client
npm install
npm run dev
```

Then open http://localhost:5173. Both the backend and frontend need to be running.