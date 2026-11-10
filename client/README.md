# ICSI 418Y Programming Assignment 4

Full-stack app with React, Express, and MongoDB. Users can sign up, log in, create projects, manage project members, and keep a backlog of user stories for each project.

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

## Preparing test data

1. On the Signup page, sign up at least three users.
2. On the Create Project page, create two projects with different project leads.
3. On the Members page, add at least one non-lead member to each project. Make one user a member of only one project.
4. On the Backlog page, create at least five stories across the two projects. Use different priorities, leave some stories unassigned, and use Edit to change some statuses to In Progress and Done.
5. To test the removal rule, try removing a member from the Members page who still has a story assigned to them. It should be rejected.