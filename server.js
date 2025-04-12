// const express = require('express');
// const admin = require('firebase-admin');
// const cors = require('cors');
// const bodyParser = require('body-parser');

// // Initialize Firebase Admin SDK
// admin.initializeApp({
//   credential: admin.credential.cert(require('./config/firebase-credentials.json')),
// });

// const app = express();
// const port = process.env.PORT || 3000;

// // Middleware
// app.use(cors());
// app.use(bodyParser.json());

// // Firestore Reference
// const listsRef = admin.firestore().collection('lists');

// // Get all to-do lists (including task count and completed tasks count)
// app.get('/lists', async (req, res) => {
//   try {
//     const snapshot = await listsRef.get();
//     const lists = snapshot.docs.map(doc => ({
//       id: doc.id,
//       title: doc.data().title,
//       taskCount: doc.data().tasks.length,
//       completedTasks: doc.data().tasks.filter(task => task.completed).length,
//     }));
//     res.status(200).json(lists);
//   } catch (error) {
//     console.error('Error fetching lists:', error);
//     res.status(500).send('Internal Server Error');
//   }
// });

// // Get tasks in a specific to-do list
// app.get('/lists/:listId/tasks', async (req, res) => {
//   const { listId } = req.params;
//   try {
//     const listDoc = await listsRef.doc(listId).get();
//     if (!listDoc.exists) {
//       return res.status(404).send('List not found');
//     }

//     const tasks = listDoc.data().tasks;
//     res.status(200).json(tasks);
//   } catch (error) {
//     console.error('Error fetching tasks:', error);
//     res.status(500).send('Internal Server Error');
//   }
// });

// // Create a new to-do list
// app.post('/lists', async (req, res) => {
//   const { title } = req.body;
//   if (!title) {
//     return res.status(400).json({ error: 'Title is required' });
//   }

//   try {
//     const newList = {
//       title,
//       tasks: [], // Initialize with no tasks
//     };

//     const newListRef = await listsRef.add(newList);
//     res.status(201).json({ id: newListRef.id, title });
//   } catch (error) {
//     console.error('Error creating list:', error);
//     res.status(500).send('Internal Server Error');
//   }
// });

// // Add a new task to a to-do list
// app.post('/lists/:listId/tasks', async (req, res) => {
//   const { listId } = req.params;
//   const { title, description } = req.body;

//   if (!title || !description) {
//     return res.status(400).json({ error: 'Title and description are required' });
//   }

//   try {
//     const listDoc = await listsRef.doc(listId).get();
//     if (!listDoc.exists) {
//       return res.status(404).send('List not found');
//     }

//     const newTask = {
//       title,
//       description,
//       completed: false, // New tasks are not completed by default
//     };

//     // Update list with the new task
//     await listsRef.doc(listId).update({
//       tasks: admin.firestore.FieldValue.arrayUnion(newTask),
//     });

//     res.status(201).json(newTask);
//   } catch (error) {
//     console.error('Error adding task:', error);
//     res.status(500).send('Internal Server Error');
//   }
// });

// // Mark a task as completed or update its status
// app.put('/lists/:listId/tasks/:taskId', async (req, res) => {
//   const { listId, taskId } = req.params;
//   const { completed } = req.body;

//   if (typeof completed !== 'boolean') {
//     return res.status(400).json({ error: 'Completed must be a boolean' });
//   }

//   try {
//     const listDoc = await listsRef.doc(listId).get();
//     if (!listDoc.exists) {
//       return res.status(404).send('List not found');
//     }

//     const tasks = listDoc.data().tasks;
//     const taskIndex = tasks.findIndex(task => task.id === taskId);
//     if (taskIndex === -1) {
//       return res.status(404).send('Task not found');
//     }

//     tasks[taskIndex].completed = completed;

//     // Update list with new task status
//     await listsRef.doc(listId).update({
//       tasks: tasks,
//     });

//     res.status(200).json(tasks[taskIndex]);
//   } catch (error) {
//     console.error('Error updating task:', error);
//     res.status(500).send('Internal Server Error');
//   }
// });

// // Delete a task from a list
// app.delete('/lists/:listId/tasks/:taskId', async (req, res) => {
//   const { listId, taskId } = req.params;

//   try {
//     const listDoc = await listsRef.doc(listId).get();
//     if (!listDoc.exists) {
//       return res.status(404).send('List not found');
//     }

//     const tasks = listDoc.data().tasks;
//     const taskIndex = tasks.findIndex(task => task.id === taskId);
//     if (taskIndex === -1) {
//       return res.status(404).send('Task not found');
//     }

//     tasks.splice(taskIndex, 1); // Remove the task from the array

//     // Update list by removing the task
//     await listsRef.doc(listId).update({
//       tasks: tasks,
//     });

//     res.status(200).send('Task deleted');
//   } catch (error) {
//     console.error('Error deleting task:', error);
//     res.status(500).send('Internal Server Error');
//   }
// });

// // Start the server
// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });



const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid'); // ✅ for generating unique task IDs

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(require('./config/firebase-credentials.json')),
});

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Firestore Reference
const listsRef = admin.firestore().collection('lists');

// Get all to-do lists (with task counts)
app.get('/lists', async (req, res) => {
  try {
    const snapshot = await listsRef.get();
    const lists = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        taskCount: data.tasks?.length || 0,
        completedTasks: data.tasks?.filter(task => task.completed).length || 0,
      };
    });
    res.status(200).json(lists);
  } catch (error) {
    console.error('Error fetching lists:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Get tasks in a specific list
app.get('/lists/:listId/tasks', async (req, res) => {
  const { listId } = req.params;
  try {
    const listDoc = await listsRef.doc(listId).get();
    if (!listDoc.exists) return res.status(404).send('List not found');

    const tasks = listDoc.data().tasks || [];
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Create a new list
app.post('/lists', async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  try {
    const newList = { title, tasks: [] };
    const newListRef = await listsRef.add(newList);
    res.status(201).json({ id: newListRef.id, title });
  } catch (error) {
    console.error('Error creating list:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Add a new task to a list
app.post('/lists/:listId/tasks', async (req, res) => {
  const { listId } = req.params;
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }

  try {
    const listDoc = await listsRef.doc(listId).get();
    if (!listDoc.exists) return res.status(404).send('List not found');

    const newTask = {
      id: uuidv4(), // ✅ Generate unique ID
      title,
      description,
      completed: false,
    };

    await listsRef.doc(listId).update({
      tasks: admin.firestore.FieldValue.arrayUnion(newTask),
    });

    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Update a task's completion status
app.put('/lists/:listId/tasks/:taskId', async (req, res) => {
  const { listId, taskId } = req.params;
  const { completed } = req.body;

  if (typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'Completed must be a boolean' });
  }

  try {
    const listDoc = await listsRef.doc(listId).get();
    if (!listDoc.exists) return res.status(404).send('List not found');

    const tasks = listDoc.data().tasks || [];
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return res.status(404).send('Task not found');

    tasks[taskIndex].completed = completed;

    await listsRef.doc(listId).update({ tasks });
    res.status(200).json(tasks[taskIndex]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Delete a task from a list
app.delete('/lists/:listId/tasks/:taskId', async (req, res) => {
  const { listId, taskId } = req.params;

  try {
    const listDoc = await listsRef.doc(listId).get();
    if (!listDoc.exists) return res.status(404).send('List not found');

    const tasks = listDoc.data().tasks || [];
    const updatedTasks = tasks.filter(task => task.id !== taskId);

    if (updatedTasks.length === tasks.length) {
      return res.status(404).send('Task not found');
    }

    await listsRef.doc(listId).update({ tasks: updatedTasks });
    res.status(200).send('Task deleted');
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

