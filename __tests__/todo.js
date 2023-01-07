const request = require("supertest");
const cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");

let server, agent;
const exstractcsrfToken = (res) => {
  const $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
};

describe("Todo Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(29000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("Create a Todo and redirect to home page to display!", async () => {
    // before message:  "Creates a todo and respond with json at /todos POST endpoint"
    const res = await agent.get("/");
    const csrfToken = exstractcsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Marks a todo with the given ID as complete", async () => {
    let res = await agent.get("/");
    let csrfToken = exstractcsrfToken(res);

    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueTodayTodos.length;
    const latestTodo = parsedGroupedResponse.dueTodayTodos[dueTodayCount - 1];

    res = await agent.get("/");
    csrfToken = exstractcsrfToken(res);

    console.log(latestTodo.id);
    const markCompleteResponse = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({
        _csrf: csrfToken,
      });

    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(true);

    // const parsedResponse = JSON.parse(response.text);
    // const todoID = parsedResponse.id;

    // expect(parsedResponse.completed).toBe(false);

    // const markCompleteResponse = await agent
    //   .put(`/todos/${todoID}/markAsCompleted`)
    //   .send();
    // const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    // expect(parsedUpdateResponse.completed).toBe(true);
  });

  test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
    let res = await agent.get("/");
    let csrfToken = exstractcsrfToken(res);

    const response = await agent.get("/todos").send({
      _csrf: csrfToken,
    });
    const parsedResponse = JSON.parse(response.text);
    const todoID = parsedResponse[0].id;
    const initLen = parsedResponse.length;

    expect(parsedResponse.length).toBe(initLen);
    const deletedStatus = await agent.delete(`/todos/${todoID}`).send({
      _csrf: csrfToken,
    });

    res = await agent.get("/");
    csrfToken = exstractcsrfToken(res);

    const response2 = await agent.get("/todos").send({
      _csrf: csrfToken,
    });
    const parsedResponse2 = JSON.parse(response2.text);
    expect(parsedResponse2.length).toBe(initLen - 1);

    const parsedStatus = JSON.parse(deletedStatus.text);
    expect(parsedStatus.success).toBe(true);
  });
});

// test("Fetches all todos in the database using /todos endpoint", async () => {
//   await agent.post("/todos").send({
//     title: "Buy xbox",
//     dueDate: new Date().toISOString(),
//     completed: false,
//   });
//   await agent.post("/todos").send({
//     title: "Buy ps3",
//     dueDate: new Date().toISOString(),
//     completed: false,
//   });
//   const response = await agent.get("/todos");
//   const parsedResponse = JSON.parse(response.text);

//   expect(parsedResponse.length).toBe(4);
//   expect(parsedResponse[3]["title"]).toBe("Buy ps3");
// });
