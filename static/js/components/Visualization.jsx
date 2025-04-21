import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const Visualization = ({ data, columns, chartType }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  // Process data for visualization
  const processDataForChart = () => {
    if (!data || data.length === 0 || !columns || columns.length === 0) {
      return null;
    }
    
    // For simplicity, we'll assume the first column is labels (x-axis)
    // and the second column is values (y-axis)
    let labelColumn = columns[0];
    let valueColumn = columns[1];
    
    // If we have date-like column, use it as label
    const dateColumns = columns.filter(col => 
      col.toLowerCase().includes('date') || 
      col.toLowerCase().includes('month') || 
      col.toLowerCase().includes('year')
    );
    
    if (dateColumns.length > 0) {
      labelColumn = dateColumns[0];
    }
    
    // If we have amount/revenue/sales/count column, use it as value
    const valueColumns = columns.filter(col => 
      col.toLowerCase().includes('amount') || 
      col.toLowerCase().includes('revenue') || 
      col.toLowerCase().includes('sales') || 
      col.toLowerCase().includes('count') ||
      col.toLowerCase().includes('total') ||
      col.toLowerCase().includes('sum') ||
      col.toLowerCase().includes('quantity')
    );
    
    if (valueColumns.length > 0) {
      valueColumn = valueColumns[0];
    }
    
    // For pie/doughnut charts, find a category column
    if (chartType === 'pie' || chartType === 'doughnut') {
      const categoryColumns = columns.filter(col => 
        col.toLowerCase().includes('category') || 
        col.toLowerCase().includes('type') || 
        col.toLowerCase().includes('segment') ||
        col.toLowerCase().includes('name') ||
        col.toLowerCase().includes('product') ||
        col.toLowerCase().includes('customer')
      );
      
      if (categoryColumns.length > 0 && categoryColumns[0] !== labelColumn) {
        labelColumn = categoryColumns[0];
      }
    }
    
    // Get unique labels
    const labels = data.map(item => item[labelColumn]);
    
    // Get datasets
    let datasets = [];
    
    // For line/bar charts with multiple series
    const remainingColumns = columns.filter(col => 
      col !== labelColumn && 
      !col.toLowerCase().includes('id') &&
      typeof data[0][col] === 'number'
    );
    
    if (remainingColumns.length > 0) {
      // Multiple numeric columns for comparison
      if (remainingColumns.length > 1 && (chartType === 'bar' || chartType === 'line')) {
        datasets = remainingColumns.map((col, index) => {
          return {
            label: col,
            data: data.map(item => item[col]),
            backgroundColor: getColorArray(index, remainingColumns.length),
            borderColor: getColorArray(index, remainingColumns.length),
            borderWidth: 1
          };
        });
      } else {
        // Single series
        datasets = [{
          label: valueColumn,
          data: data.map(item => item[valueColumn]),
          backgroundColor: getColorArray(0, data.length),
          borderColor: chartType === 'line' ? getColorArray(0, 1) : getColorArray(0, data.length),
          borderWidth: 1
        }];
      }
    }
    
    return {
      labels,
      datasets
    };
  };
  
  // Function to generate colors
  const getColorArray = (index, count) => {
    const colors = [
      '#4e79a7', '#f28e2c', '#e15759', '#76b7b2', 
      '#59a14f', '#edc949', '#af7aa1', '#ff9da7',
      '#9c755f', '#bab0ab'
    ];
    
    if (count === 1) {
      return colors[index % colors.length];
    }
    
    if (chartType === 'pie' || chartType === 'doughnut') {
      return Array(count).fill().map((_, i) => colors[i % colors.length]);
    }
    
    return colors[index % colors.length];
  };
  
  // Create or update chart
  useEffect(() => {
    const chartData = processDataForChart();
    
    if (!chartData) return;
    
    // Destroy previous chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Create chart configuration
    const config = {
      type: chartType || 'bar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
        },
        scales: chartType !== 'pie' && chartType !== 'doughnut' ? {
          x: {
            title: {
              display: true,
              text: columns[0]
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: columns[1]
            }
          }
        } : undefined
      }
    };
    
    // Create the chart
    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, config);
    
    // Clean up on component unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, columns, chartType]);
  
  if (!data || data.length === 0) {
    return (
      <div className="alert alert-info">
        No data available to visualize.
      </div>
    );
  }
  
  return (
    <div className="chart-container">
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

export default Visualization;
