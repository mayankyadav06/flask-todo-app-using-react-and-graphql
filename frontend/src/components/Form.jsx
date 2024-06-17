import { gql } from "@apollo/client";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";

const ADD_TODO_MUTATION = gql`
  mutation AddTodo(
    $title: String!
    $description: String!
    $reminder: String!
    $image: String
    $status: Boolean!
  ) {
    addTodo(
      title: $title
      description: $description
      reminder: $reminder
      image: $image
      status: $status
    ) {
      title
      description
      reminder
      image
      status
    }
  }
`;

// Convert image file to base64 if present
export const getBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

function Form({
  todos,
  setTodos,
  title,
  setTitle,
  description,
  setDescription,
  reminder,
  setReminder,
  image,
  setImage,
  client,
}) {
  // Event handler for form submission
  const handleAddTodo = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    const imageBase64 = image ? await getBase64(image) : null;
    // Format reminder date to '%d/%m/%Y %H:%M'

    const formattedReminder = reminder
      ? new Date(reminder)
          .toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
          .replace(",", "")
      : null;

    // Call the mutation
    client
      .mutate({
        mutation: ADD_TODO_MUTATION,
        variables: {
          title,
          description,
          reminder: formattedReminder,
          image: imageBase64,
          status: false,
        },
      })
      .then((response) => {
        // Update your state with the new todo
        setTodos([...todos, response.data.addTodo]);

        // Reset form fields
        setTitle("");
        setDescription("");
        setReminder("");
        setImage("");
      })
      .catch((error) => {
        console.error("Error adding todo:", error);
      });
  };

  return (
    <div
      className="container"
      style={{
        borderColor: "#1D231D",
        border: "1px solid #ccc",
        borderRadius: "6px",
        width: "100%",
        maxWidth: "650px",
        margin: "0 auto",
      }}
    >
      <form
        onSubmit={handleAddTodo}
        style={{
          boxShadow: "2px 2px 4px 4px rgba(0,0,0,10)",
          padding: "0.5rem",
          background: "#1D231D",
          color: "#FFFFFF",
          fontFamily: "cursive",
          display: "flex",
          borderRadius: "6px",
          flexDirection: "column",
          gap: "2rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <label> Title: </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your task?"
              maxLength="60"
              style={{
                flex: 1,
                marginRight: "1rem",
                border: "0",
                borderStyle: "none",
                color: "#FFFFFF",
                background: "#1D231D",
              }} // Add some space between the inputs
            />
          </div>
          <div>
            <label> Description: </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell me about it...."
              maxLength="200"
              style={{
                background: "#f0f0f0",
                flex: 1,
                border: "0",
                borderStyle: "none",
                color: "#FFFFFF",
                background: "#1D231D",
              }}
            />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <label> Time: </label>
            <input
              style={{
                border: "0",
                borderStyle: "none",
                color: "#FFFFFF",
                background: "#1D231D",
              }}
              type="datetime-local"
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
            />
          </div>

          <div>
            <label> Image: </label>
            <input
              type="file"
              onChange={(e) => setImage(e.target.files[0])}
              style={{
                border: "0",
                borderStyle: "none",
                color: "#FFFFFF",
                background: "#1D231D",
              }}
            />
          </div>
          <div
            style={{ display: "flex", justifyContent: "center", color: "red" }}
          >
            <Button  style={{fontFamily:"cursive", background: "#0F96B7", border: "0",
                borderStyle: "none",
                color: "#FFFFFF", borderRadius:"3px"}} size="small" type="submit">
              Let's Add
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Form;
