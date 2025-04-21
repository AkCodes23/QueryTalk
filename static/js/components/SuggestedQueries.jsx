import React from 'react';

const SuggestedQueries = ({ queries, onQueryClick }) => {
  if (!queries || queries.length === 0) {
    return null;
  }
  
  return (
    <div className="suggested-queries">
      <div className="row">
        {queries.map((query, index) => (
          <div className="col-md-4 mb-2" key={index}>
            <div 
              className="card suggested-query h-100" 
              onClick={() => onQueryClick(query)}
            >
              <div className="card-body">
                <h6 className="card-title">
                  <i className="fas fa-search me-2"></i>
                  {query}
                </h6>
                <small className="text-muted">Click to ask</small>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestedQueries;
