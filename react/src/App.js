import React, { useState, useEffect, useMemo } from "react";
import * as tf from "@tensorflow/tfjs";
import './App.css';

export default function App() {
  const [model, setModel] = useState(null);
  const [products, setProducts] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [darkMode, setDarkMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'current_inventory', direction: 'ascending' });
  const [selectedProduct, setSelectedProduct] = useState(null); 
  const itemsPerPage = 10;
  
  // Filter/Search State
  const [filter, setFilter] = useState("all"); 
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ total: 0, reorder: 0, safe: 0 });

  // 1. Initialize Predictive System
  useEffect(() => {
    async function initSystem() {
      const model = tf.sequential();
      model.add(tf.layers.dense({ inputShape: [3], units: 8, activation: "relu" }));
      model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));
      model.compile({ optimizer: "adam", loss: "binaryCrossentropy", metrics: ["accuracy"] });

      const trainingData = tf.tensor2d([
        [0, 50, 5],   [5, 20, 3],   [100, 10, 2], 
        [50, 50, 2],  [2, 40, 4],   [80, 5, 5]    
      ]);
      const outputData = tf.tensor2d([[1], [1], [0], [0], [1], [0]]); 

      await model.fit(trainingData, outputData, { epochs: 250, shuffle: true });
      setModel(model);
    }
    initSystem();
  }, []);

  // 2. Fetch Data
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('http://localhost:8083/api/products');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Connection Error:", error);
      }
    }
    loadData();
  }, []);

  // 3. System Analysis
  useEffect(() => {
    async function analyzeStock() {
      if (model && products.length > 0) {
        const results = {};
        let reorderCount = 0;

        for (const product of products) {
            const input = tf.tensor2d([[product.current_inventory, product.avg_sales, product.lead_time]]);
            const prediction = model.predict(input);
            const score = (await prediction.data())[0];
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
        setLoading(false);
      }
    }
    analyzeStock();
  }, [model, products]);

  // Sorting Logic
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Export Logic
  const handleExport = () => {
    const headers = ["Product,Stock,Sales/Wk,Lead Time,Status\n"];
    const rows = products.map(p => 
      `${p.name},${p.current_inventory},${p.avg_sales},${p.lead_time},${predictions[p.id]}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + headers + rows.join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "inventory_report.csv";
    link.click();
  };

  // Filter & Search Logic
  const processedProducts = useMemo(() => {
    let data = products.filter(p => {
      const matchesFilter = filter === "all" || predictions[p.id] === filter;
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });

    if (sortConfig.key) {
      data.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [products, predictions, filter, searchTerm, sortConfig]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = processedProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(processedProducts.length / itemsPerPage);

  const topSales = [...products].sort((a,b) => b.avg_sales - a.avg_sales).slice(0, 5);
  const reorderPercent = stats.total > 0 ? (stats.reorder / stats.total) * 100 : 0;
  
  const getExplanation = (p) => {
    if (predictions[p.id] === "Reorder") {
      if (p.current_inventory === 0) return "Stock is empty (0). Immediate restock required.";
      if (p.current_inventory < p.avg_sales) return `Stock (${p.current_inventory}) is lower than weekly sales (${p.avg_sales}). Risk of stockout.`;
      return "Stock levels are critically low relative to lead time.";
    }
    return "Inventory levels are sufficient to meet current demand.";
  };

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-text">IMS Enterprise</div>
        </div>
        <nav className="nav-menu">
          <button className="nav-link active">Overview</button>
          <button className="nav-link">Inventory</button>
          <button className="nav-link">Procurement</button>
        </nav>
      </aside>

      <main className="content-area">
        {stats.reorder > 0 && (
          <div className="alert-banner">
            <span className="alert-text"><strong>Attention:</strong> {stats.reorder} products require replenishment.</span>
            <button className="btn-link" onClick={() => setFilter("Reorder")}>Filter List</button>
          </div>
        )}

        <header className="page-header">
          <div>
            <h1>Inventory Dashboard</h1>
            <p className="breadcrumb">System / Real-time Status</p>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
            <button className="btn-primary" onClick={handleExport}>Export Report</button>
          </div>
        </header>

        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">Total Inventory</div>
            <div className="kpi-value">{loading ? "..." : stats.total}</div>
          </div>
          <div className="kpi-card warning">
            <div className="kpi-label">Restock Needed</div>
            <div className="kpi-value text-danger">{loading ? "..." : stats.reorder}</div>
          </div>
          <div className="kpi-card success">
            <div className="kpi-label">Optimal Level</div>
            <div className="kpi-value text-success">{loading ? "..." : stats.safe}</div>
          </div>
        </div>

        {!loading && (
          <div className="charts-container">
            <div className="panel">
              <div className="panel-header"><h3>Top Movers (Sales Velocity)</h3></div>
              <div className="panel-body">
                {topSales.map(p => (
                  <div key={p.id} className="chart-row">
                    <div className="row-info">
                      <span className="row-name">{p.name}</span>
                      <span className="row-stat">{p.avg_sales} sold/wk</span>
                    </div>
                    <div className="progress-bg">
                      <div className="progress-fill accent" style={{ width: `${Math.min(p.avg_sales, 100)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel centered-panel">
               <div className="panel-header"><h3>Replenishment Distribution</h3></div>
               <div className="panel-body centered">
                  <div className="pie-chart" style={{
                    background: `conic-gradient(var(--danger) 0% ${reorderPercent}%, var(--success) ${reorderPercent}% 100%)`
                  }}>
                    <div className="pie-hole">
                      <span>{Math.round(reorderPercent)}%</span>
                      <small>Critical</small>
                    </div>
                  </div>
                  <div className="chart-legend">
                    <div className="legend-item"><span className="dot red"></span> Reorder</div>
                    <div className="legend-item"><span className="dot green"></span> Safe</div>
                  </div>
               </div>
            </div>
          </div>
        )}

        <div className="panel table-panel">
          <div className="panel-header with-controls">
            <h3>Inventory List</h3>
            <div className="controls">
              <input 
                type="text" placeholder="Search..." className="search-input"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select className="filter-select" onChange={(e) => setFilter(e.target.value)} value={filter}>
                <option value="all">All Items</option>
                <option value="Reorder">Restock Needed</option>
                <option value="Safe">Optimal Only</option>
              </select>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => requestSort('name')} className="sortable">Product {sortConfig.key==='name' ? (sortConfig.direction==='ascending'?'▲':'▼'):''}</th>
                <th onClick={() => requestSort('current_inventory')} className="sortable">Stock Level {sortConfig.key==='current_inventory' ? (sortConfig.direction==='ascending'?'▲':'▼'):''}</th>
                <th onClick={() => requestSort('avg_sales')} className="sortable">Avg. Sales {sortConfig.key==='avg_sales' ? (sortConfig.direction==='ascending'?'▲':'▼'):''}</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center">Loading Data...</td></tr>
              ) : (
                currentItems.map(p => (
                  <tr key={p.id} className="fade-in">
                    <td className="fw-bold">{p.name}</td>
                    <td>
                       <span className="stock-display">{p.current_inventory}</span>
                    </td>
                    <td>{p.avg_sales}</td>
                    <td>
                      <span className={`status-pill ${predictions[p.id] === "Reorder" ? "pill-danger" : "pill-success"}`}>
                        {predictions[p.id] === "Reorder" ? "Restock Needed" : "Optimal"}
                      </span>
                    </td>
                    <td>
                      <button className="btn-sm" onClick={() => setSelectedProduct(p)}>Analysis Report</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="pagination">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Previous</button>
            <span>Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
          </div>
        </div>
      </main>

      {selectedProduct && (
        <div className="modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Report: {selectedProduct.name}</h2>
              <button className="close-btn" onClick={() => setSelectedProduct(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                 <div className="detail-item">
                    <label>Current Stock</label>
                    <div className="value">{selectedProduct.current_inventory}</div>
                 </div>
                 <div className="detail-item">
                    <label>Sales Velocity</label>
                    <div className="value">{selectedProduct.avg_sales} / week</div>
                 </div>
                 <div className="detail-item">
                    <label>Lead Time</label>
                    <div className="value">{selectedProduct.lead_time} days</div>
                 </div>
              </div>

              <div className={`recommendation-box ${predictions[selectedProduct.id] === "Reorder" ? "rec-danger" : "rec-success"}`}>
                <h4>Logic Explanation</h4>
                <p>{getExplanation(selectedProduct)}</p>
                <div className="status-large">
                   Decision: 
                   <strong>{predictions[selectedProduct.id] === "Reorder" ? " RESTOCK ORDER ADVISED" : " SUFFICIENT STOCK"}</strong>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedProduct(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}