import { gql } from "@apollo/client";
import defaultPlaceholder from "./default_placeholder.jpg";
import { MdDeleteOutline, MdEdit, MdCheck } from "react-icons/md";
import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import { FaCheck } from "react-icons/fa6";

const EDIT_TODO_MUTATION = gql`
  mutation EditTodo(
    $_id: ID!
    $title: String
    $description: String # $reminder: String! # $image: String # $status: Boolean!
  ) {
    editTodo(_id: $_id, title: $title, description: $description) {
      _id
      title
      description
    }
  }
`;

const COMPLETE_TODO_MUTATION = gql`
  mutation CompleteTodo($_id: ID!) {
    completeTodo(_id: $_id) {
      _id
      status
    }
  }
`;

const DELETE_TODO_MUTATION = gql`
  mutation DeleteTodo($_id: ID!) {
    deleteTodo(_id: $_id) {
      success
    }
  }
`;

function ListTodos({ todos, setTodos, client }) {
  return (
    <ol className="todo_list">
      {todos && todos.length > 0 ? (
        todos?.map((item) => (
          <Item
            key={item._id}
            item={item}
            setTodos={setTodos}
            client={client}
          />
        ))
      ) : (
        <p>Seems lonely in here, what are you up to?</p>
      )}
    </ol>
  );
}

function Item({ item, setTodos, client }) {
  const [editing, setEditing] = useState(false);
  const [originalItem, setOriginalItem] = useState(null);
  const inputRef = React.useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();

      // position the cursor at the end of the text
      inputRef.current.setSelectionRange(
        inputRef.current.value.length,
        inputRef.current.value.length
      );
    }
  }, [editing]);

  const deleteTodo = async (_id) => {
    try {
      const response = await client.mutate({
        mutation: DELETE_TODO_MUTATION,
        variables: {
          _id,
        },
      });
      if (response.data.deleteTodo.success) {
        setTodos((prevTodos) => prevTodos.filter((todo) => todo._id !== _id));
      } else {
        console.error("Error deleting todo at server");
      }
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  const completeTodo = async (item) => {
    try {
      console.log("Item ID:", item._id);
      await client.mutate({
        mutation: COMPLETE_TODO_MUTATION,
        variables: {
          _id: item._id,
        },
      });
      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo._id === item._id ? { ...todo, status: !item.status } : todo
        )
      );
    } catch (error) {
      console.error("Error checking todo:", error);
    }
  };

  const handleEdit = () => {
    setOriginalItem({ ...item });
    setEditing(true);
  };

  const handleInputChange = (field, value) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo._id === item._id ? { ...todo, [field]: value } : todo
      )
    );
  };

  const updateTodo = async (item, originalItem) => {
    let hasChanges = false;
    const variables = { _id: item._id };

    if (item.title !== originalItem.title) {
      variables.title = item.title;
      hasChanges = true;
    }
    if (item.description !== originalItem.description) {
      variables.description = item.description;
      hasChanges = true;
    }

    if (hasChanges) {
      try {
        await client.mutate({
          mutation: EDIT_TODO_MUTATION,
          variables,
        });
        // Update local state after successful edit
        setTodos((prevTodos) =>
          prevTodos.map((todo) =>
            todo._id === item._id ? { ...todo, ...variables } : todo
          )
        );
        return true; // Indicates success
      } catch (error) {
        console.error("Error updating todo:", error);
        return false; // Indicates failure
      }
    } else {
      return false; // Indicates no changes were made
    }
  };

  const handleInputSubmit = async (event) => {
    event.preventDefault();
    await updateTodo(item, originalItem);

    setEditing(false); // Exit editing mode on success or no changes
  };

  const handleInputBlur = async (event) => {
    // Check if the related target is not another input in the edit form
    if (
      !event.relatedTarget ||
      event.relatedTarget.form !== event.target.form
    ) {
      await updateTodo(item, originalItem);
      setEditing(false); // Exit editing mode on success or no changes
    }
  };

  return (
    <ol key="_id" className="todo-item">
      {editing ? (
        <div
          style={{
            boxShadow: "2px 2px 4px 4px rgba(0,0,0,10)",
            background: "#1D231D",
            fontFamily: "cursive",
            color: "#FFFFFF",
            position: "relative",
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1rem",
            display: "flex",
            justifyContent: "space-between",
            maxWidth: "500px",
            width: "100%",
          }}
        >
          <form className="edit-form" onSubmit={handleInputSubmit}>
            <div style={{ display: "flex" }}>
              <img
                src={
                  item.image
                    ? `data:image/jpeg;base64,${item.image}`
                    : defaultPlaceholder
                }
                alt="Todo"
                style={{
                  width: "70px",
                  height: "70px",
                  objectFit: "cover",
                  marginRight: "1rem",
                }}
              />
              <div style={{ justifyContent: "space-between" }}>
                <div>
                  <label htmlFor="edit-todo">
                    <input
                      ref={inputRef}
                      type="text"
                      name="edit-todo-title"
                      id="edit-todo-title"
                      defaultValue={item?.title}
                      onBlur={handleInputBlur}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      style={{
                        border: "0",
                        borderStyle: "hidden",
                        color: "#FFFFFF",
                        background: "#1D231D",
                      }}
                    />
                  </label>
                  <p
                    style={{
                      fontSize: "16px",
                      margin: "0",
                      fontStyle: "italic",
                    }}
                  >
                    {item.status
                      ? `Completed`
                      : `Complete before ${item.reminder}`}
                  </p>
                  <label htmlFor="edit-todo">
                    <input
                      type="text"
                      name="edit-todo-description"
                      id="edit-todo-description"
                      defaultValue={item?.description}
                      onBlur={handleInputBlur}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      style={{
                        border: "0",
                        borderStyle: "hidden",
                        color: "#FFFFFF",
                        background: "#1D231D",
                      }}
                    />
                  </label>
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  right: "1rem",
                  top: "1rem",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "1rem",
                  fontSize: "24px",
                }}
              >
                <Button
                  variant="contained"
                  size="small"
                  style={{fontFamily:"cursive", background: "#0F96B7", border: "0",
                    borderStyle: "none",
                    color: "#FFFFFF", borderRadius:"5px"}}
                >
                  {" "}
                  Save
                </Button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div
          key={item._id}
          style={{
            boxShadow: "2px 2px 4px 4px rgba(0,0,0,10)",
            background: "#1D231D",
            fontFamily: "cursive",
            border: "1px solid #ccc",
            borderColor: "#1D231D",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1rem",
            display: "flex",
            justifyContent: "space-between",
            maxWidth: "450px",
            width: "100%",
          }}
        >
          <div style={{ display: "flex" }}>
            <img
              src={
                item.image
                  ? `data:image/jpeg;base64,${item.image}`
                  : defaultPlaceholder
              }
              alt="Todo"
              style={{
                width: "70px",
                height: "70px",
                objectFit: "cover",
                marginRight: "1rem",
              }}
            />
            <div style={{ color: "#FFFFFF", fontFamily: "cursive" }}>
              <h2
                style={{
                  color: "#FFFFFF",
                  fontFamily: "cursive",
                  fontSize: "18px",
                  margin: "0",
                  textDecoration: item.status ? "line-through" : {},
                }}
              >
                {item.title}
              </h2>
              <p
                style={{
                  fontSize: "12px",
                  margin: "0",
                  fontStyle: "italic",
                }}
              >
                {item.status ? `Completed` : `Complete before ${item.reminder}`}
              </p>
              <p style={{ fontSize: "14px", margin: "0" }}>
                {item.status ? "" : `${item.description}`}
              </p>
            </div>
          </div>
          <div
            style={{
              
              display: "flex",
              gap: "1rem",
              fontSize: "24px",
              margin: "1.5rem",
            }}
          >
            {item.status ? null : <MdEdit style={{color:"#0F96B7"}} onClick={handleEdit}></MdEdit>}
            <MdDeleteOutline
            style={{color:"red"}}
              onClick={() => deleteTodo(item._id)}
            ></MdDeleteOutline>
            {item.status ? null : (
              <FaCheck style={{color:"green"}} onClick={() => completeTodo(item)}></FaCheck>
            )}
          </div>
        </div>
      )}
    </ol>
    // </div>
  );
}

export default ListTodos;
