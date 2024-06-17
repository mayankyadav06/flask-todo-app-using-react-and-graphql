from flask import Flask, request, jsonify
from flask_cors import CORS #type: ignore
from ariadne import QueryType, MutationType, make_executable_schema, graphql_sync, ObjectType #type:ignore
from pymongo.mongo_client import MongoClient #type:ignore
from pymongo.server_api import ServerApi #type:ignore
import base64
from datetime import datetime
from bson import ObjectId #type:ignore
from dotenv import load_dotenv #type: ignore
import os





load_dotenv()
uri = os.environ.get("MONGO_URI")
client = MongoClient(uri, server_api=ServerApi('1'))

try:
    client.admin.command('ping')
    print("Pinged your deployment in Flask. You successfully connected to MongoDB!")
except Exception as e:
    print(e)
    
todos_collection  = client.cluster0.todos

# Define your types using Ariadne's ObjectType
todo_type = ObjectType("Todo")

@todo_type.field("title")
def resolve_title(todo, info):
    return todo["title"]

@todo_type.field("description")
def resolve_description(todo, info):
    return todo["description"]

@todo_type.field("reminder")
def resolve_reminder(todo, info):
    return todo["reminder"]

@todo_type.field("image")
def resolve_image(todo, info):
    return todo["image"]

@todo_type.field("status")
def resolve_image(todo, info):
    return todo["status"]

@todo_type.field("_id")
def resolve_id(todo, info):
    return str(todo["_id"])

query = QueryType()

@query.field("todos")
def resolve_todos(*_):
    # Fetch todos from MongoDB using pymongo
    todos = todos_collection.find()
    result = []
    for todo in todos:
        if todo['image'] and isinstance(todo['image'], str):
            image_data = todo['image']
        else:
            image_data = base64.b64encode(todo['image']).decode("utf-8") if todo['image'] else None
        result.append({'_id': str(todo['_id']), 
                       'title': todo['title'], 
                       'description': todo['description'], 
                       'reminder': todo['reminder'], 
                       'image': image_data, 
                       'status': todo['status']})
    return result


mutation = MutationType()

@mutation.field("addTodo")
def resolve_add_todo(_, info, title, description, reminder, image, status):
    try:
        image_data = None
        if image and ',' in image:
            image_data = base64.b64decode(image.split(',')[1])
            
        if image_data:
            image_data = base64.b64encode(image_data).decode("utf-8")
            
        reminder_date = datetime.strptime(reminder, "%d/%m/%Y %H:%M")
        todo_data = {
            'title': title,
            'description': description,
            'reminder': reminder_date,
            'image': image_data ,
            'status': status
        }
        # Insert new todo into MongoDB using pymongo
        todos_collection.insert_one(todo_data)
        return todo_data
    except Exception as e:
        raise Exception('Todo could not added because of:',e)


@mutation.field("editTodo")
def resolve_edit_todo(_, info, _id, title=None, description=None):
    update_fields = {}
    if title is not None:
        update_fields['title'] = title
    if description is not None:
        update_fields['description'] = description

    if not update_fields:
        existing_todo = todos_collection.find_one({'_id': ObjectId(_id)})
        if existing_todo:
            # Return only the fields specified in EditTodoResponse
            return {
                '_id': str(existing_todo['_id']),
                'title': existing_todo.get('title', None),
                'description': existing_todo.get('description', None),
            }
        else:
            raise Exception('Todo not found')

    result = todos_collection.update_one({'_id': ObjectId(_id)}, {'$set': update_fields})
    if result.modified_count == 1:
        return {
            '_id': _id,
            'title': title,
            'description': description,
        }
    else:
        raise Exception('Todo not found or not edited')

   

@mutation.field("completeTodo")
def resolve_complete_todo(_, info, _id):
    
    result = todos_collection.update_one({'_id': ObjectId(_id)}, {'$set': {'status':True}})
    if result.modified_count == 1:
        return {
             '_id' : _id,
            'status': True
        } 
    else:
        raise Exception('Todo not found or not checked')
    

@mutation.field("deleteTodo")
def resolve_delete_todo(_, info, _id):
    result = todos_collection.delete_one({'_id': ObjectId(_id)})
    if result.deleted_count == 1:
        return {'success':True}
    else:
        raise Exception('Todo not found or not deleted')




type_defs = """
type Todo {
    _id: ID!
  title: String!
  description: String!
  reminder: String!
  image: String
  status: Boolean!
}

type Query {
  todos: [Todo!]!
}

type CompleteTodoResponse{
    _id: ID!
    status: Boolean!
}

type EditTodoResponse{
    _id:ID!
    title: String
    description: String
}
type DeleteTodoResponse {
    success: Boolean!
}

type Mutation {
  addTodo(title: String!, description: String!, reminder: String!, image: String, status: Boolean!): Todo!
  
  editTodo(_id: ID!, title: String, description: String): EditTodoResponse!
  
  completeTodo(_id: ID!): CompleteTodoResponse!
  
  deleteTodo(_id: ID!): DeleteTodoResponse!
}
"""
schema = make_executable_schema(type_defs, query, mutation)



app = Flask(__name__)
CORS(app)



@app.route("/graphql", methods=["POST"])
def graphql_server():
    # GraphQL queries are always sent as POST
    data = request.get_json()
    
    success, result = graphql_sync(
        schema,
        data,
        context_value=request,
        debug=app.debug
    )

    status_code = 200 if success else 400
    return jsonify(result), status_code

if __name__ == '__main__':
    app.run(debug=True)



