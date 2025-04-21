import React from 'react';

const QueryHistory = ({ history, onSelectHistoryItem }) => {
  if (!history || history.length === 0) {
    return (
      <div className="text-center text-muted py-4">
        <i className="fas fa-history fa-2x mb-2"></i>
        <p>No query history yet</p>
      </div>
    );
  }
  
  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Function to get short version of SQL for display
  const getSqlPreview = (sql) => {
    if (!sql) return '';
    
    const maxLength = 40;
    return sql.length > maxLength 
      ? sql.substring(0, maxLength) + '...' 
      : sql;
  };
  
  return (
    <div className="query-history">
      <div className="list-group">
        {history.map((item) => (
          <div 
            key={item.id}
            className="list-group-item list-group-item-action query-history-item" 
            onClick={() => onSelectHistoryItem(item)}
          >
            <div className="d-flex w-100 justify-content-between">
              <h6 className="mb-1 text-truncate">{item.query}</h6>
              <small className="text-muted ms-2">
                {formatDate(item.created_at)}
              </small>
            </div>
            <small className="text-muted d-block text-truncate">
              <i className="fas fa-database me-1"></i>
              {getSqlPreview(item.sql)}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QueryHistory;
