import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import VoiceInput from './components/VoiceInput';
import Visualization from './components/Visualization';
import QueryHistory from './components/QueryHistory';
import SuggestedQueries from './components/SuggestedQueries';

const App = () => {
  // State for current query
  const [currentQuery, setCurrentQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [error, setError] = useState('');
  
  // State for AI agent response
  const [aiResponse, setAiResponse] = useState(null);
  
  // State for query results
  const [queryResults, setQueryResults] = useState(null);
  
  // State for query history
  const [queryHistory, setQueryHistory] = useState([]);
  
  // Fetch query history on component mount
  useEffect(() => {
    fetchQueryHistory();
  }, []);
  
  // Function to fetch query history
  const fetchQueryHistory = async () => {
    try {
      const response = await fetch('/api/query-history');
      const data = await response.json();
      
      if (response.ok) {
        setQueryHistory(data);
      } else {
        console.error('Error fetching query history:', data.error);
      }
    } catch (error) {
      console.error('Error fetching query history:', error);
    }
  };
  
  // Function to process voice query
  const processQuery = async (query) => {
    setCurrentQuery(query);
    setIsProcessing(true);
    setProcessingStep('Analyzing with AI...');
    setError('');
    
    try {
      // Send query to AI agent
      const aiResponse = await fetch('/api/voice-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      const aiData = await aiResponse.json();
      
      if (!aiResponse.ok) {
        setError(aiData.error || 'Error processing query with AI');
        setIsProcessing(false);
        return;
      }
      
      setAiResponse(aiData);
      setProcessingStep('Running SQL query...');
      
      // Execute the SQL query
      const sqlResponse = await fetch('/api/run-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql: aiData.sql }),
      });
      
      const sqlData = await sqlResponse.json();
      
      if (!sqlResponse.ok) {
        setError(sqlData.error || 'Error executing SQL query');
        setIsProcessing(false);
        return;
      }
      
      setQueryResults(sqlData);
      setIsProcessing(false);
      
      // Refresh query history
      fetchQueryHistory();
      
    } catch (error) {
      console.error('Error processing query:', error);
      setError('An unexpected error occurred');
      setIsProcessing(false);
    }
  };
  
  // Function to handle selecting a history item
  const handleHistorySelect = (historyItem) => {
    setCurrentQuery(historyItem.query);
    setAiResponse({
      sql: historyItem.sql,
      explanation: historyItem.explanation,
      suggested_queries: [],
    });
    
    // Re-run the SQL query
    executeSqlQuery(historyItem.sql);
  };
  
  // Function to execute SQL query
  const executeSqlQuery = async (sql) => {
    setIsProcessing(true);
    setProcessingStep('Running SQL query...');
    setError('');
    
    try {
      const sqlResponse = await fetch('/api/run-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql }),
      });
      
      const sqlData = await sqlResponse.json();
      
      if (!sqlResponse.ok) {
        setError(sqlData.error || 'Error executing SQL query');
        setIsProcessing(false);
        return;
      }
      
      setQueryResults(sqlData);
      setIsProcessing(false);
      
    } catch (error) {
      console.error('Error executing SQL query:', error);
      setError('An unexpected error occurred');
      setIsProcessing(false);
    }
  };
  
  // Function to handle suggested query click
  const handleSuggestedQueryClick = (query) => {
    processQuery(query);
  };
  
  return (
    <div className="container-fluid py-4">
      <div className="row g-4">
        {/* Left column: Voice input and History */}
        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">
                <i className="fas fa-microphone me-2"></i>
                Voice Query
              </h5>
              <VoiceInput onQueryComplete={processQuery} isProcessing={isProcessing} />
              
              {currentQuery && (
                <div className="mt-3">
                  <h6>Current Query:</h6>
                  <p className="border-start border-primary ps-3">{currentQuery}</p>
                </div>
              )}
              
              {error && (
                <div className="alert alert-danger mt-3">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}
            </div>
          </div>
          
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">
                <i className="fas fa-history me-2"></i>
                Query History
              </h5>
              <QueryHistory 
                history={queryHistory} 
                onSelectHistoryItem={handleHistorySelect} 
              />
            </div>
          </div>
        </div>
        
        {/* Right column: Visualization and Results */}
        <div className="col-md-8">
          {isProcessing ? (
            <div className="card h-100">
              <div className="card-body d-flex flex-column justify-content-center align-items-center py-5">
                <div className="loading-spinner mb-3"></div>
                <h5>{processingStep}</h5>
              </div>
            </div>
          ) : queryResults ? (
            <>
              <div className="card mb-4">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="fas fa-chart-bar me-2"></i>
                    Visualization
                  </h5>
                  <Visualization 
                    data={queryResults.data} 
                    columns={queryResults.columns} 
                    chartType={aiResponse?.chart_type || 'bar'} 
                  />
                </div>
              </div>
              
              <div className="card mb-4">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="fas fa-table me-2"></i>
                    Results
                  </h5>
                  <div className="table-responsive">
                    <table className="table table-striped table-hover">
                      <thead>
                        <tr>
                          {queryResults.columns.map((column, index) => (
                            <th key={index}>{column}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResults.data.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {queryResults.columns.map((column, colIndex) => (
                              <td key={colIndex}>{row[column]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {aiResponse && aiResponse.sql && (
                    <div className="mt-4">
                      <h6>Generated SQL:</h6>
                      <div className="sql-display">{aiResponse.sql}</div>
                      
                      {aiResponse.explanation && (
                        <div className="mt-3">
                          <h6>Explanation:</h6>
                          <p>{aiResponse.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {aiResponse && aiResponse.suggested_queries && (
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">
                      <i className="fas fa-lightbulb me-2"></i>
                      Follow-up Questions
                    </h5>
                    <SuggestedQueries 
                      queries={aiResponse.suggested_queries} 
                      onQueryClick={handleSuggestedQueryClick} 
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card h-100">
              <div className="card-body d-flex flex-column justify-content-center align-items-center py-5">
                <i className="fas fa-microphone fa-4x mb-4 text-secondary"></i>
                <h5 className="text-center">Ask a business question using your voice</h5>
                <p className="text-center text-muted">
                  For example: "Show me revenue by product category" or "What are the top selling products this month?"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Render the React app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

// Set a flag to indicate that Vite successfully loaded the app
window.viteLoaded = true;
