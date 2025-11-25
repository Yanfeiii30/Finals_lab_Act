// File: ./react-src/src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import your page components
import TaskList from './pages/TaskList';
import AddTask from './pages/AddTask';
// import TaskEdit from './pages/TaskEdit'; // You will add this for Task 5

function App() {
  return (
    <div className="app-container">
      <h1>Task Management System</h1>
      
      <Routes>
        {/* Default route redirects to the task list */}
        <Route path="/" element={<Navigate to="/task-list" replace />} />
        
        <Route path="/task-list" element={<TaskList />} />
        <Route path="/add-task" element={<AddTask />} />
        
        {/* Later, you will add routes for editing and viewing */}
        {/* <Route path="/edit-task/:taskId" element={<TaskEdit />} /> */}
      </Routes>
    </div>
  );
}

export default App;