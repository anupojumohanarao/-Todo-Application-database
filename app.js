/*Sql command
CREATE TABLE todo (id INTEGER, todo TEXT, priority TEXT, status TEXT); 
INSERT INTO todo (id, todo, priority, status)
Values (1, "Learn HTML", "HIGH", "TO DO"),
(2, "Learn JS", "MEDIUM", "DONE"),
(3, "Learn CSS", "LOW", "DONE");
SELECT * from todo;
*/

const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertStatsAndProperties = (dbObject) => {
  return dbObject.priority !== undefined && dbObject.status !== undefined;
};

const convertPriorityProperties = (dbObject) => {
  return dbObject.priority !== undefined;
};

const convertStatsProperties = (dbObject) => {
  return dbObject.status !== undefined;
};

//1st GET todo status API
app.get("/todos/", async (request, response) => {
  let totalData = null;
  const getTotalTodoDataQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case convertStatsAndProperties(request.query):
      getTotalTodoDataQuery = `
        SELECT * FROM todo
        WHERE 
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;
    case convertPriorityProperties(request.query):
      getTotalTodoDataQuery = `
        SELECT * FROM todo 
        WHERE todo LIKE '%${search_q}%'
        AND priority = '${priority}'`;
      break;
    case convertStatsProperties(request.query):
      getTotalTodoDataQuery = `
        SELECT * FROM todo 
        WHERE todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;
    default:
      getTotalTodoDataQuery = `
      SELECT * FROM todo
      WHERE todo LIKE '%${search_q}%';`;
  }
  totalData = await db.all(getTotalTodoDataQuery);
  response.send(totalData);
});

//2nd GET todos and todosID API
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const totalTodoIdQuery = `
  SELECT * FROM todo 
  WHERE id = ${todoId}`;
  const convertTodoIds = await db.get(totalTodoIdQuery);
  response.send(convertTodoIds);
});

//3rd POST todos API
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const getNewTodos = `
  INSERT INTO 
  todo (id, todo, priority, status)
  VALUES (${id}, '${todo}', '${priority}', '${status}');`;
  await db.run(getNewTodos);
  response.send("Todo Successfully Added");
});

//4th PUT todos and todosId API
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let newAndUpdateTodoId = "";
  const todoRequest = request.body;
  switch (true) {
    case todoRequest.status !== undefined:
      newAndUpdateTodoId = "Status";
      break;
    case todoRequest.priority !== undefined:
      newAndUpdateTodoId = "Priority";
      break;
    case todoRequest.todo !== undefined:
      newAndUpdateTodoId = "Todo";
      break;
  }
  const oldTodoIdQuery = `
  SELECT * FROM todo 
  WHERE id = '${todoId};'`;
  const oldTodo = await db.get(oldTodoIdQuery);

  const {
    todo = oldTodo.todo,
    priority = oldTodo.priority,
    status = oldTodo.status,
  } = request.body;

  const newTodoIdQuerys = `
      UPDATE todo SET 
      todo = '${todo}',
      priority = '${priority}',
      status = '${status}'
      WHERE id = '${todoId}';`;
  await db.run(newTodoIdQuerys);
  response.send(`${newAndUpdateTodoId} Updated`);
});

//5th DELETE todos and todosID API
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoId = `
    DELETE FROM todo 
    WHERE id = '${todoId}';`;
  await db.run(deleteTodoId);
  response.send("Todo Deleted");
});

module.exports = app;
