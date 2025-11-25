<?php

// Make sure to use the API Controller namespace if you put it in an API folder
// namespace App\Http\Controllers\API; 
namespace App\Http\Controllers; // Or just this, if it's in the base Controllers folder

use App\Models\Task;
use Illuminate\Http\Request;
// use App\Http\Controllers\Controller; // <-- Add this line if you use the API subfolder

class TaskController extends Controller
{
    /**
     * Display a listing of the resource.
     * GET /api/tasks
     */
    public function index()
    {
        // Fetch all tasks
        return Task::orderBy('created_at', 'desc')->get();
    }

    /**
     * Store a newly created resource in storage.
     * POST /api/tasks
     */
    public function store(Request $request)
    {
        // Validate the incoming data
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'string|in:pending,in-progress,completed', // 'in' rule is better than enum
            'due_date' => 'nullable|date',
        ]);

        // Create and return the new task
        $task = Task::create($validated);
        return response()->json($task, 201); // 201 = Created
    }

    /**
     * Display the specified resource.
     * GET /api/tasks/{id}
     */
    public function show(Task $task)
    {
        // Laravel's Route-Model Binding finds the task for you.
        return $task;
    }

    /**
     * Update the specified resource in storage.
     * PUT /api/tasks/{id}
     */
    public function update(Request $request, Task $task)
    {
        // Validate the incoming data
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255', // 'sometimes' = only validate if present
            'description' => 'nullable|string',
            'status' => 'sometimes|string|in:pending,in-progress,completed',
            'due_date' => 'nullable|date',
        ]);

        // Update the task
        $task->update($validated);

        return response()->json($task);
    }

    /**
     * Remove the specified resource from storage.
     * DELETE /api/tasks/{id}
     */
    public function destroy(Task $task)
    {
        $task->delete();

        // Return a 204 No Content response
        return response()->json(null, 204);
    }
}