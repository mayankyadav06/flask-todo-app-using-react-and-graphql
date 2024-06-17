import React, { useState, useEffect } from "react";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import Form from "./components/Form";
import ListTodos from "./components/ListTodos";


const client = new ApolloClient({
  uri: "http://localhost:5000/graphql",
  cache: new InMemoryCache(),
});

const GET_TODOS_QUERY = gql`
  query GetTodos {
    todos {
      _id
      title
      description
      reminder
      image
      status
    }
  }
`;

function App() {
  console.log("App component is rendering");
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reminder, setReminder] = useState("");
  const [image, setImage] = useState("");
  // const [status, setStatus] = useState("");

  useEffect(() => {
    client
      .query({
        query: GET_TODOS_QUERY,
      })
      .then((response) => {
        const formattedTodos = response.data.todos.map((todo) => ({
          ...todo,
          reminder: new Date(todo.reminder).toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));
        console.log("Formatted Todos:", formattedTodos);
        setTodos(formattedTodos);
      });
  }, []);

  console.log("Current Todos State:", todos);
  return (
    <div
      className="App"
      style={{ backgroundColor:"#101210" ,display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh"  }}
    >
      <h1 style={{ textAlign: "center" , color:"#FFFFFF", fontFamily:'cursive'}}>My ToDo</h1>
      <div style={{ width: "100%", maxWidth: "700px", margin: "0 auto" }}>
        <Form
          todos={todos}
          setTodos={setTodos}
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          reminder={reminder}
          setReminder={setReminder}
          image={image}
          setImage={setImage}
          client={client}
        />
        <ListTodos todos={todos} setTodos={setTodos} client={client} />
      </div>
    </div>
  );
}

export default App;
