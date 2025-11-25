import React, { useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import './App.css';

export default function App() {
  const [model, setModel] = useState(null);
  const [products, setProducts] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Dashboard Stats
  const [stats, setStats] = useState({ total: 0, reorder: 0, safe: 0 });

  // 1. Initialize Prediction Model (Hidden Logic)
  useEffect(() => {
    async function initSystem() {
      // Define a simple logic model
      const model = tf.sequential();
      model.add(tf.layers.dense({ inputShape: [3], units: 8, activation: "relu" }));
      model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));
      model.compile({ optimizer: "adam", loss: "binaryCrossentropy", metrics: ["accuracy"] });

      // Logic: [Stock, Sales, LeadTime] -> 1 (Reorder) or 0 (Safe)
      const trainingData = tf.tensor2d([
        [20, 50, 3], // Low stock + High sales = Reorder
        [5, 30, 5],  // Critical stock = Reorder
        [50, 10, 2], // High stock + Low sales = Safe
        [8, 60, 2],  // Low stock = Reorder
      ]);
      const outputData = tf.tensor2d([[0], [1], [0], [1]]); 

      await model.fit(trainingData, outputData, { epochs: 200, shuffle: true });
      setModel(model);
    }
    initSystem();
  }, []);

  // 2. Fetch Tech Products & Run Analysis
  useEffect(() => {
    async function loadData() {
      try {
        // Fetch from Laravel Backend
        const response = await fetch('http://localhost:8083/api/products');
        const data = await response.json();
        
        // Artificial delay so you can see the Skeleton Loading effect (Remove if not needed)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setProducts(data);
      } catch (error) {
        console.error("System Error:", error);
      }
    }
    loadData();
  }, []);

  // 3. Process Data
  useEffect(() => {
    async function analyzeStock() {
      if (model && products.length > 0) {
        const results = {};
        let reorderCount = 0;

        for (const product of products) {
            const input = tf.tensor2d([[
                product.current_inventory, 
                product.avg_sales, 
                product.lead_time
            ]]);
            
            const prediction = model.predict(input);
            const score = (await prediction.data())[0];
            
            // If score > 0.5, item needs restocking
            const status = score > 0.5 ? "Reorder" : "Safe";
            results[product.id] = status;
            
            if (status === "Reorder") reorderCount++;

            input.dispose(); prediction.dispose();
        }

        setPredictions(results);
        setStats({
            total: products.length,
            reorder: reorderCount,
            safe: products.length - reorderCount
        });
        setLoading(false); // Hide skeleton, show data
      }
    }
    analyzeStock();
  }, [model, products]);

  return (
    <div className="dashboard-container">
      <header>
        <h1>Inventory Management System</h1>
        <p>Tech Product Stock & Replenishment Dashboard</p>
      </header>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="card">
          <h3>Total SKU Count</h3>
          <div className="number">{stats.total}</div>
        </div>
        <div className="card alert">
          <h3>Restock Required</h3>
          <div className="number">{stats.reorder}</div>
        </div>
        <div className="card safe">
          <h3>Healthy Stock</h3>
          <div className="number">{stats.safe}</div>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Current Stock</th>
              <th>Avg. Sales/Week</th>
              <th>Lead Time (Days)</th>
              <th>Reorder Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // --- SKELETON LOADER (Display while processing) ---
              Array.from({ length: 8 }).map((_, index) => (
                <tr key={index}>
                  <td><span className="skeleton text"></span></td>
                  <td><span className="skeleton number"></span></td>
                  <td><span className="skeleton number"></span></td>
                  <td><span className="skeleton number"></span></td>
                  <td><span className="skeleton badge"></span></td>
                </tr>
              ))
            ) : (
              // --- REAL DATA ---
              products.map(product => (
                <tr key={product.id}>
                  <td style={{ fontWeight: "600" }}>{product.name}</td>
                  <td>{product.current_inventory} units</td>
                  <td>{product.avg_sales}</td>
                  <td>{product.lead_time}</td>
                  <td>
                    <span className={`badge ${predictions[product.id] === "Reorder" ? "reorder" : "ok"}`}>
                      {predictions[product.id] === "Reorder" ? "Low Stock" : "Sufficient"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}