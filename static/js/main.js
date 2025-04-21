// Voice to Visualization app - Enhanced Version with new features
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded');
  
  // DOM elements
  const voiceQueryContainer = document.getElementById('voice-query-container');
  const visualizationContainer = document.getElementById('visualization-container');
  const dataTableContainer = document.getElementById('data-table-container');
  const queryHistoryContainer = document.getElementById('query-history-container');
  const favoriteQueriesContainer = document.getElementById('favorite-queries-container');
  const micButton = document.getElementById('mic-button');
  const queryTextarea = document.getElementById('query-textarea');
  const sendQueryButton = document.getElementById('send-query-button');
  const loadingIndicator = document.getElementById('loading-indicator');
  const errorContainer = document.getElementById('error-container');
  const suggestedQueriesContainer = document.getElementById('suggested-queries-container');
  const emptyStateElement = document.getElementById('empty-state');
  const suggestedQueriesSection = document.getElementById('suggested-queries-section');
  
  // New elements for enhanced features
  const chartTypeSelect = document.getElementById('chart-type-select');
  const colorThemeSelect = document.getElementById('color-theme-select');
  const exportChartImageBtn = document.getElementById('export-chart-image');
  const exportTableCsvBtn = document.getElementById('export-table-csv');
  const exportTableExcelBtn = document.getElementById('export-table-excel');
  const shareReportLinkBtn = document.getElementById('share-report-link');
  const toggleAnnotationsBtn = document.getElementById('toggle-annotations');
  
  // Accessibility elements
  const toggleHighContrastBtn = document.getElementById('toggle-high-contrast');
  const toggleKeyboardShortcutsBtn = document.getElementById('toggle-keyboard-shortcuts');
  const increaseFontSizeBtn = document.getElementById('increase-font-size');
  const decreaseFontSizeBtn = document.getElementById('decrease-font-size');
  const savePreferencesBtn = document.getElementById('save-preferences');
  
  // Log elements found for debugging
  console.log('DOM elements found?', {
    voiceQueryContainer: !!voiceQueryContainer,
    visualizationContainer: !!visualizationContainer,
    dataTableContainer: !!dataTableContainer,
    emptyState: !!emptyStateElement
  });
  
  // Chart instance
  let chartInstance = null;
  
  // User preferences object
  let userPreferences = loadPreferences();
  
  // Apply saved preferences on load
  applyPreferences();
  
  // Language selector
  const languageSelector = document.getElementById('language-selector');
  
  // Get or set preferred language from preferences
  if (userPreferences.language) {
    languageSelector.value = userPreferences.language;
  }
  
  // Save language preference when changed
  languageSelector.addEventListener('change', function() {
    const selectedLanguage = this.value;
    
    // Save to preferences if option is enabled
    if (userPreferences.saveLanguagePref) {
      userPreferences.language = selectedLanguage;
      savePreferences();
    }
    
    // Update recognition language if it exists
    if (recognition) {
      recognition.lang = selectedLanguage;
      console.log(`Speech recognition language changed to: ${selectedLanguage}`);
    }
  });
  
  // Recognition object for speech-to-text
  let recognition = null;
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = languageSelector.value; // Use selected language
    
    // When a result is recognized
    recognition.onresult = function(event) {
      const transcript = event.results[event.resultIndex][0].transcript;
      queryTextarea.value = transcript;
    };
    
    // When recognition ends
    recognition.onend = function() {
      micButton.innerHTML = '<i class="fas fa-microphone fa-lg"></i>';
      micButton.classList.remove('recording');
    };
    
    // If there's an error
    recognition.onerror = function(event) {
      console.error('Speech recognition error:', event.error);
      showError('Speech recognition error: ' + event.error);
      micButton.innerHTML = '<i class="fas fa-microphone fa-lg"></i>';
      micButton.classList.remove('recording');
    };
  }
  
  // Toggle voice recording
  let isRecording = false;
  micButton.addEventListener('click', function() {
    if (!recognition) {
      showError('Speech recognition is not supported in your browser. Please try Chrome or Edge.');
      return;
    }
    
    if (isRecording) {
      recognition.stop();
      isRecording = false;
    } else {
      recognition.start();
      isRecording = true;
      micButton.innerHTML = '<i class="fas fa-microphone-slash fa-lg"></i>';
      micButton.classList.add('recording');
    }
  });
  
  // Send query when button is clicked
  sendQueryButton.addEventListener('click', function() {
    const query = queryTextarea.value.trim();
    if (query) {
      processQuery(query);
    }
  });
  
  // Chart type selector event listener
  if (chartTypeSelect) {
    chartTypeSelect.addEventListener('change', function() {
      if (chartInstance && chartInstance.data) {
        updateChartType(this.value);
        
        // Save to preferences if option is enabled
        if (userPreferences.saveChartsPref) {
          userPreferences.chartType = this.value;
          savePreferences();
        }
      }
    });
    
    // Set initial value from preferences
    if (userPreferences.chartType) {
      chartTypeSelect.value = userPreferences.chartType;
    }
  }
  
  // Color theme selector event listener
  if (colorThemeSelect) {
    colorThemeSelect.addEventListener('change', function() {
      if (chartInstance && chartInstance.data) {
        updateChartColorTheme(this.value);
        
        // Save to preferences if option is enabled
        if (userPreferences.saveChartsPref) {
          userPreferences.colorTheme = this.value;
          savePreferences();
        }
      }
    });
    
    // Set initial value from preferences
    if (userPreferences.colorTheme) {
      colorThemeSelect.value = userPreferences.colorTheme;
    }
  }
  
  // Export buttons event listeners
  if (exportChartImageBtn) {
    exportChartImageBtn.addEventListener('click', exportChartAsImage);
  }
  
  if (exportTableCsvBtn) {
    exportTableCsvBtn.addEventListener('click', exportTableAsCSV);
  }
  
  if (exportTableExcelBtn) {
    exportTableExcelBtn.addEventListener('click', exportTableAsExcel);
  }
  
  if (shareReportLinkBtn) {
    shareReportLinkBtn.addEventListener('click', shareReportLink);
  }
  
  // Toggle annotations button event listener
  if (toggleAnnotationsBtn) {
    toggleAnnotationsBtn.addEventListener('click', toggleAnnotations);
  }
  
  // Accessibility buttons event listeners
  if (toggleHighContrastBtn) {
    toggleHighContrastBtn.addEventListener('click', toggleHighContrast);
  }
  
  if (toggleKeyboardShortcutsBtn) {
    toggleKeyboardShortcutsBtn.addEventListener('click', toggleKeyboardShortcuts);
  }
  
  if (increaseFontSizeBtn) {
    increaseFontSizeBtn.addEventListener('click', increaseFontSize);
  }
  
  if (decreaseFontSizeBtn) {
    decreaseFontSizeBtn.addEventListener('click', decreaseFontSize);
  }
  
  // Save preferences button event listener
  if (savePreferencesBtn) {
    savePreferencesBtn.addEventListener('click', function() {
      // Update preferences from form inputs
      userPreferences.saveLanguagePref = document.getElementById('save-language-pref').checked;
      userPreferences.saveChartsPref = document.getElementById('save-charts-pref').checked;
      userPreferences.enableShortcuts = document.getElementById('enable-shortcuts').checked;
      userPreferences.highContrastMode = document.getElementById('high-contrast-mode').checked;
      
      // Apply preferences immediately
      applyPreferences();
      
      // Save to localStorage
      savePreferences();
      
      // Show feedback toast
      showToast('Preferences saved successfully');
    });
  }
  
  // Initialize form inputs with saved preferences
  document.getElementById('save-language-pref').checked = userPreferences.saveLanguagePref;
  document.getElementById('save-charts-pref').checked = userPreferences.saveChartsPref;
  document.getElementById('enable-shortcuts').checked = userPreferences.enableShortcuts;
  document.getElementById('high-contrast-mode').checked = userPreferences.highContrastMode;
  
  // Setup keyboard shortcuts
  setupKeyboardShortcuts();
  
  // Process the query
  function processQuery(query) {
    showLoading('Analyzing with AI...');
    
    // Get the selected language
    const selectedLanguage = document.getElementById('language-selector').value;
    
    // First, send to AI to generate SQL
    fetch('/api/voice-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query,
        language: selectedLanguage 
      }),
    })
    .then(response => response.json())
    .then(aiResponse => {
      if (aiResponse.error) {
        throw new Error(aiResponse.error);
      }
      
      showLoading('Running SQL query...');
      
      // Then execute the SQL
      return fetch('/api/run-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql: aiResponse.sql }),
      })
      .then(response => response.json())
      .then(sqlData => {
        if (sqlData.error) {
          throw new Error(sqlData.error);
        }
        
        // Hide loading indicator
        hideLoading();
        
        // Display results
        displayResults(sqlData, aiResponse);
        
        // Update query history
        fetchQueryHistory();
      });
    })
    .catch(error => {
      hideLoading();
      showError(error.message);
    });
  }
  
  // Display results
  function displayResults(queryResults, aiResponse) {
    console.log('Displaying results:', { 
      rows: queryResults.data.length, 
      columns: queryResults.columns.length,
      chartType: aiResponse.chart_type 
    });
    
    // Hide empty state
    if (emptyStateElement) {
      emptyStateElement.classList.add('d-none');
    }
    
    // Show visualization container
    visualizationContainer.classList.remove('d-none');
    dataTableContainer.classList.remove('d-none');
    
    // Use preferred chart type if enabled
    let chartType = aiResponse.chart_type || 'bar';
    if (userPreferences.saveChartsPref && userPreferences.chartType) {
      chartType = userPreferences.chartType;
      
      // Update chart type selector
      if (chartTypeSelect) {
        chartTypeSelect.value = chartType;
      }
    }
    
    // Clear previous chart
    if (chartInstance) {
      chartInstance.destroy();
    }
    
    // Create chart
    const chartCanvas = document.getElementById('chart-canvas');
    console.log('Chart canvas found:', !!chartCanvas);
    const chartData = processDataForChart(queryResults.data, queryResults.columns, chartType);
    
    if (chartData) {
      // Use preferred color theme if enabled
      let colorTheme = 'default';
      if (userPreferences.saveChartsPref && userPreferences.colorTheme) {
        colorTheme = userPreferences.colorTheme;
        
        // Update color theme selector
        if (colorThemeSelect) {
          colorThemeSelect.value = colorTheme;
        }
      }
      
      // Apply color theme to chart data
      applyColorTheme(chartData, colorTheme, chartType);
      
      chartInstance = new Chart(chartCanvas, {
        type: chartType,
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
                text: queryResults.columns[0]
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: queryResults.columns[1]
              }
            }
          } : undefined
        }
      });
      
      // Store current chart data for export and sharing
      window.currentChartData = {
        type: chartType,
        data: chartData,
        queryResults: queryResults,
        aiResponse: aiResponse
      };
    }
    
    // Display data table
    const tableBody = document.getElementById('results-table-body');
    const tableHead = document.getElementById('results-table-head');
    
    // Clear previous data
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    
    // Add headers
    const headerRow = document.createElement('tr');
    queryResults.columns.forEach(column => {
      const th = document.createElement('th');
      th.textContent = column;
      headerRow.appendChild(th);
    });
    tableHead.appendChild(headerRow);
    
    // Add data rows
    queryResults.data.forEach(row => {
      const tr = document.createElement('tr');
      queryResults.columns.forEach(column => {
        const td = document.createElement('td');
        td.textContent = row[column];
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });
    
    // Display SQL and explanation
    document.getElementById('generated-sql').textContent = aiResponse.sql;
    document.getElementById('sql-explanation').textContent = aiResponse.explanation || '';
    
    // Display suggested queries
    suggestedQueriesContainer.innerHTML = '';
    if (aiResponse.suggested_queries && aiResponse.suggested_queries.length > 0) {
      const row = document.createElement('div');
      row.className = 'row';
      
      aiResponse.suggested_queries.forEach(query => {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-2';
        
        const card = document.createElement('div');
        card.className = 'card suggested-query h-100';
        card.addEventListener('click', () => processQuery(query));
        
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';
        
        const cardTitle = document.createElement('h6');
        cardTitle.className = 'card-title';
        cardTitle.innerHTML = `<i class="fas fa-search me-2"></i>${query}`;
        
        const cardText = document.createElement('small');
        cardText.className = 'text-muted';
        cardText.textContent = 'Click to ask';
        
        cardBody.appendChild(cardTitle);
        cardBody.appendChild(cardText);
        card.appendChild(cardBody);
        col.appendChild(card);
        row.appendChild(col);
      });
      
      suggestedQueriesContainer.appendChild(row);
      document.getElementById('suggested-queries-section').classList.remove('d-none');
    } else {
      document.getElementById('suggested-queries-section').classList.add('d-none');
    }
  }
  
  // Process data for chart visualization
  function processDataForChart(data, columns, chartType) {
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
    if (chartType && (chartType === 'pie' || chartType === 'doughnut')) {
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
      if (remainingColumns.length > 1 && chartType && (chartType === 'bar' || chartType === 'line')) {
        datasets = remainingColumns.map((col, index) => {
          return {
            label: col,
            data: data.map(item => item[col]),
            backgroundColor: getColorArray(index, remainingColumns.length, chartType),
            borderColor: getColorArray(index, remainingColumns.length, chartType),
            borderWidth: 1
          };
        });
      } else {
        // Single series
        datasets = [{
          label: valueColumn,
          data: data.map(item => item[valueColumn]),
          backgroundColor: getColorArray(0, data.length, chartType),
          borderColor: chartType && chartType === 'line' ? getColorArray(0, 1, chartType) : getColorArray(0, data.length, chartType),
          borderWidth: 1
        }];
      }
    }
    
    return {
      labels,
      datasets
    };
  }
  
  // Function to generate colors
  function getColorArray(index, count, chartType) {
    // Color palettes
    const colorPalettes = {
      default: [
        '#4e79a7', '#f28e2c', '#e15759', '#76b7b2', 
        '#59a14f', '#edc949', '#af7aa1', '#ff9da7',
        '#9c755f', '#bab0ab'
      ],
      vibrant: [
        '#e41a1c', '#377eb8', '#4daf4a', '#984ea3', 
        '#ff7f00', '#ffff33', '#a65628', '#f781bf',
        '#999999', '#66c2a5'
      ],
      pastel: [
        '#8dd3c7', '#ffffb3', '#bebada', '#fb8072', 
        '#80b1d3', '#fdb462', '#b3de69', '#fccde5',
        '#d9d9d9', '#bc80bd'
      ],
      monochrome: [
        '#08306b', '#08519c', '#2171b5', '#4292c6', 
        '#6baed6', '#9ecae1', '#c6dbef', '#deebf7',
        '#3182bd', '#9ecae1'
      ]
    };
    
    // Get current color theme
    const colorTheme = userPreferences.colorTheme || 'default';
    const colors = colorPalettes[colorTheme] || colorPalettes.default;
    
    if (count === 1) {
      return colors[index % colors.length];
    }
    
    // For pie/doughnut charts, return an array of colors
    const chartTypes = ['pie', 'doughnut'];
    if (chartTypes.includes(chartType)) {
      return Array(count).fill().map((_, i) => colors[i % colors.length]);
    }
    
    return colors[index % colors.length];
  }
  
  // Function to apply color theme to chart data
  function applyColorTheme(chartData, colorTheme, chartType) {
    // Color palettes
    const colorPalettes = {
      default: [
        '#4e79a7', '#f28e2c', '#e15759', '#76b7b2', 
        '#59a14f', '#edc949', '#af7aa1', '#ff9da7',
        '#9c755f', '#bab0ab'
      ],
      vibrant: [
        '#e41a1c', '#377eb8', '#4daf4a', '#984ea3', 
        '#ff7f00', '#ffff33', '#a65628', '#f781bf',
        '#999999', '#66c2a5'
      ],
      pastel: [
        '#8dd3c7', '#ffffb3', '#bebada', '#fb8072', 
        '#80b1d3', '#fdb462', '#b3de69', '#fccde5',
        '#d9d9d9', '#bc80bd'
      ],
      monochrome: [
        '#08306b', '#08519c', '#2171b5', '#4292c6', 
        '#6baed6', '#9ecae1', '#c6dbef', '#deebf7',
        '#3182bd', '#9ecae1'
      ]
    };
    
    // Get colors for the selected theme
    const colors = colorPalettes[colorTheme] || colorPalettes.default;
    
    // Apply colors to datasets
    chartData.datasets.forEach((dataset, index) => {
      if (chartType === 'pie' || chartType === 'doughnut') {
        dataset.backgroundColor = chartData.labels.map((_, i) => colors[i % colors.length]);
        dataset.borderColor = '#ffffff';
      } else {
        dataset.backgroundColor = colors[index % colors.length];
        dataset.borderColor = chartType === 'line' ? colors[index % colors.length] : '#ffffff';
      }
    });
  }
  
  // Function to update chart type
  function updateChartType(newChartType) {
    if (!chartInstance || !chartInstance.data) return;
    
    // Save current data
    const currentData = chartInstance.data;
    
    // Destroy current chart
    chartInstance.destroy();
    
    // Apply color theme based on new chart type
    applyColorTheme(currentData, userPreferences.colorTheme || 'default', newChartType);
    
    // Create new chart with same data but different type
    const chartCanvas = document.getElementById('chart-canvas');
    chartInstance = new Chart(chartCanvas, {
      type: newChartType,
      data: currentData,
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
        scales: newChartType !== 'pie' && newChartType !== 'doughnut' ? {
          x: {
            title: {
              display: true,
              text: chartInstance.options.scales?.x?.title?.text || ''
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: chartInstance.options.scales?.y?.title?.text || ''
            }
          }
        } : undefined
      }
    });
    
    // Update current chart data for export and sharing
    if (window.currentChartData) {
      window.currentChartData.type = newChartType;
    }
  }
  
  // Function to update chart color theme
  function updateChartColorTheme(newColorTheme) {
    if (!chartInstance || !chartInstance.data) return;
    
    // Save current data and type
    const currentData = chartInstance.data;
    const currentType = chartInstance.config.type;
    
    // Apply new color theme
    applyColorTheme(currentData, newColorTheme, currentType);
    
    // Update chart
    chartInstance.update();
    
    // Update current chart data for export and sharing
    if (window.currentChartData) {
      window.currentChartData.data = currentData;
    }
  }
  
  // Function to export chart as image
  function exportChartAsImage() {
    if (!chartInstance) {
      showToast('No chart available to export', 'warning');
      return;
    }
    
    // Create a link element
    const link = document.createElement('a');
    link.download = 'chart-export-' + new Date().toISOString().slice(0, 10) + '.png';
    link.href = chartInstance.toBase64Image();
    link.click();
  }
  
  // Function to export table as CSV
  function exportTableAsCSV() {
    if (!window.currentChartData || !window.currentChartData.queryResults) {
      showToast('No data available to export', 'warning');
      return;
    }
    
    const { queryResults } = window.currentChartData;
    const { columns, data } = queryResults;
    
    // Create CSV content
    let csvContent = columns.join(',') + '\\n';
    
    data.forEach(row => {
      const rowValues = columns.map(col => {
        // Handle values with commas by wrapping in quotes
        let value = row[col];
        if (typeof value === 'string' && value.includes(',')) {
          value = `"${value}"`;
        }
        return value;
      });
      csvContent += rowValues.join(',') + '\\n';
    });
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'data-export-' + new Date().toISOString().slice(0, 10) + '.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  // Function to export table as Excel
  function exportTableAsExcel() {
    if (!window.currentChartData || !window.currentChartData.queryResults) {
      showToast('No data available to export', 'warning');
      return;
    }
    
    showToast('Excel export functionality requires an Excel JS library. Using CSV export instead.', 'info');
    exportTableAsCSV();
  }
  
  // Function to share report link
  function shareReportLink() {
    if (!window.currentChartData) {
      showToast('No data available to share', 'warning');
      return;
    }
    
    // Get current query and chart settings
    const { type, queryResults, aiResponse } = window.currentChartData;
    const includeHistory = document.getElementById('include-query-history').checked;
    
    // Create a state object to encode in the URL
    const stateObj = {
      q: queryResults.originalQuery || aiResponse.voice_query || '',
      sql: aiResponse.sql,
      chartType: type,
      colorTheme: userPreferences.colorTheme || 'default',
      includeHistory: includeHistory
    };
    
    // Create a shareable link (base64 encoded state)
    const stateBase64 = btoa(JSON.stringify(stateObj));
    const shareableLink = `${window.location.origin}${window.location.pathname}?state=${stateBase64}`;
    
    // Show modal with link
    document.getElementById('share-link-input').value = shareableLink;
    
    // Create and show modal using Bootstrap
    const shareModal = new bootstrap.Modal(document.getElementById('shareReportModal'));
    shareModal.show();
    
    // Add click event for copy button
    document.getElementById('copy-link-button').addEventListener('click', function() {
      const linkInput = document.getElementById('share-link-input');
      linkInput.select();
      document.execCommand('copy');
      showToast('Link copied to clipboard!', 'success');
    });
  }
  
  // Function to toggle annotations
  function toggleAnnotations() {
    if (!chartInstance) return;
    
    // TODO: Implement annotations for charts
    // This is a placeholder for the annotation feature
    showToast('Annotations feature will be available in the next update', 'info');
  }
  
  // Accessibility functions
  
  // Toggle high contrast mode
  function toggleHighContrast() {
    userPreferences.highContrastMode = !userPreferences.highContrastMode;
    document.getElementById('high-contrast-mode').checked = userPreferences.highContrastMode;
    applyPreferences();
    savePreferences();
    
    showToast(`High contrast mode ${userPreferences.highContrastMode ? 'enabled' : 'disabled'}`, 'info');
  }
  
  // Toggle keyboard shortcuts
  function toggleKeyboardShortcuts() {
    userPreferences.enableShortcuts = !userPreferences.enableShortcuts;
    document.getElementById('enable-shortcuts').checked = userPreferences.enableShortcuts;
    applyPreferences();
    savePreferences();
    
    showToast(`Keyboard shortcuts ${userPreferences.enableShortcuts ? 'enabled' : 'disabled'}`, 'info');
  }
  
  // Increase font size
  function increaseFontSize() {
    // Get current font size from html element or default to 16px
    const html = document.documentElement;
    const currentSize = parseFloat(window.getComputedStyle(html, null).getPropertyValue('font-size'));
    
    // Increase by 1px, max 24px
    const newSize = Math.min(currentSize + 1, 24);
    html.style.fontSize = `${newSize}px`;
    
    // Store in preferences
    userPreferences.fontSize = newSize;
    savePreferences();
    
    showToast(`Font size increased to ${newSize}px`, 'info');
  }
  
  // Decrease font size
  function decreaseFontSize() {
    // Get current font size from html element or default to 16px
    const html = document.documentElement;
    const currentSize = parseFloat(window.getComputedStyle(html, null).getPropertyValue('font-size'));
    
    // Decrease by 1px, min 12px
    const newSize = Math.max(currentSize - 1, 12);
    html.style.fontSize = `${newSize}px`;
    
    // Store in preferences
    userPreferences.fontSize = newSize;
    savePreferences();
    
    showToast(`Font size decreased to ${newSize}px`, 'info');
  }
  
  // Setup keyboard shortcuts
  function setupKeyboardShortcuts() {
    if (!userPreferences.enableShortcuts) return;
    
    document.addEventListener('keydown', function(e) {
      // Only process if no inputs are focused
      if (document.activeElement.tagName === 'INPUT' || 
          document.activeElement.tagName === 'TEXTAREA' || 
          document.activeElement.tagName === 'SELECT') {
        return;
      }
      
      // Alt+M: Toggle microphone
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        micButton.click();
      }
      
      // Alt+S: Submit query
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        if (sendQueryButton) sendQueryButton.click();
      }
      
      // Alt+E: Open export menu
      if (e.altKey && e.key === 'e') {
        e.preventDefault();
        if (document.getElementById('export-dropdown')) {
          document.getElementById('export-dropdown').click();
        }
      }
      
      // Alt+C: Focus chart type selector
      if (e.altKey && e.key === 'c') {
        e.preventDefault();
        if (chartTypeSelect) chartTypeSelect.focus();
      }
      
      // Escape: Clear query
      if (e.key === 'Escape') {
        e.preventDefault();
        queryTextarea.value = '';
        queryTextarea.focus();
      }
    });
  }
  
  // Load user preferences from localStorage
  function loadPreferences() {
    const defaultPreferences = {
      language: 'en-US',
      chartType: 'bar',
      colorTheme: 'default',
      highContrastMode: false,
      enableShortcuts: true,
      saveLanguagePref: true,
      saveChartsPref: true,
      fontSize: 16,
      favorites: []
    };
    
    try {
      const savedPrefs = localStorage.getItem('userPreferences');
      return savedPrefs ? { ...defaultPreferences, ...JSON.parse(savedPrefs) } : defaultPreferences;
    } catch (error) {
      console.error('Error loading preferences:', error);
      return defaultPreferences;
    }
  }
  
  // Save user preferences to localStorage
  function savePreferences() {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }
  
  // Apply user preferences to UI
  function applyPreferences() {
    // Apply high contrast mode if enabled
    if (userPreferences.highContrastMode) {
      document.body.classList.add('high-contrast-mode');
    } else {
      document.body.classList.remove('high-contrast-mode');
    }
    
    // Apply font size if set
    if (userPreferences.fontSize) {
      document.documentElement.style.fontSize = `${userPreferences.fontSize}px`;
    }
    
    // Apply language preference if saving is enabled
    const languageSelector = document.getElementById('language-selector');
    if (userPreferences.saveLanguagePref && userPreferences.language && languageSelector) {
      languageSelector.value = userPreferences.language;
      if (recognition) {
        recognition.lang = userPreferences.language;
      }
    }
  }
  
  // Fetch and display query history
  function fetchQueryHistory() {
    fetch('/api/query-history')
      .then(response => response.json())
      .then(history => {
        // Clear previous history
        queryHistoryContainer.innerHTML = '';
        
        if (history.length === 0) {
          document.getElementById('no-history-message').classList.remove('d-none');
          return;
        } else {
          document.getElementById('no-history-message').classList.add('d-none');
        }
        
        // Create history list
        history.forEach(item => {
          const historyItem = document.createElement('div');
          historyItem.className = 'query-item';
          historyItem.setAttribute('role', 'button');
          historyItem.setAttribute('tabindex', '0');
          
          // Check if this query is in favorites
          const isFavorite = userPreferences.favorites.includes(item.id);
          if (isFavorite) {
            historyItem.classList.add('favorited');
          }
          
          // Create layout
          historyItem.innerHTML = `
            <div class="d-flex align-items-start justify-content-between">
              <div class="flex-grow-1" style="cursor: pointer;" title="Click to run this query again">
                <strong class="d-block">${item.query}</strong>
                <small class="text-muted">${new Date(item.created_at).toLocaleString()}</small>
                <small class="text-muted d-block text-truncate"><i class="fas fa-database me-1"></i>${getSqlPreview(item.sql)}</small>
              </div>
              <button class="favorite-button ms-2 ${isFavorite ? 'active' : ''}" data-id="${item.id}" title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                <i class="fas fa-star"></i>
              </button>
            </div>
          `;
          
          // Add query execute event
          historyItem.querySelector('.flex-grow-1').addEventListener('click', () => {
            queryTextarea.value = item.query;
            processQuery(item.query);
          });
          
          // Add keyboard accessibility
          historyItem.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              queryTextarea.value = item.query;
              processQuery(item.query);
            }
          });
          
          // Add favorite toggle
          historyItem.querySelector('.favorite-button').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(item);
            e.currentTarget.classList.toggle('active');
            historyItem.classList.toggle('favorited');
            e.currentTarget.setAttribute('title', e.currentTarget.classList.contains('active') ? 'Remove from favorites' : 'Add to favorites');
            
            // Update favorites display
            displayFavorites();
          });
          
          queryHistoryContainer.appendChild(historyItem);
        });
        
        // Update favorites display
        displayFavorites();
      })
      .catch(error => {
        console.error('Error fetching query history:', error);
      });
  }
  
  // Toggle favorite status of a query
  function toggleFavorite(item) {
    // Initialize favorites array if it doesn't exist
    if (!userPreferences.favorites) {
      userPreferences.favorites = [];
    }
    
    // Check if already in favorites
    const index = userPreferences.favorites.indexOf(item.id);
    
    if (index === -1) {
      // Add to favorites
      userPreferences.favorites.push(item.id);
    } else {
      // Remove from favorites
      userPreferences.favorites.splice(index, 1);
    }
    
    // Save preferences
    savePreferences();
  }
  
  // Display favorite queries
  function displayFavorites() {
    if (!favoriteQueriesContainer) return;
    
    // Clear container
    favoriteQueriesContainer.innerHTML = '';
    
    // Check if we have any favorites
    if (!userPreferences.favorites || userPreferences.favorites.length === 0) {
      document.getElementById('no-favorites-message').style.display = 'block';
      return;
    } else {
      document.getElementById('no-favorites-message').style.display = 'none';
    }
    
    // Fetch all history to get full query details for favorites
    fetch('/api/query-history')
      .then(response => response.json())
      .then(history => {
        // Filter to only favorite items
        const favorites = history.filter(item => userPreferences.favorites.includes(item.id));
        
        if (favorites.length === 0) {
          document.getElementById('no-favorites-message').style.display = 'block';
          return;
        }
        
        // Display each favorite
        favorites.forEach(item => {
          const favoriteItem = document.createElement('div');
          favoriteItem.className = 'query-item favorited';
          favoriteItem.setAttribute('role', 'button');
          favoriteItem.setAttribute('tabindex', '0');
          
          // Create layout
          favoriteItem.innerHTML = `
            <div class="d-flex align-items-start justify-content-between">
              <div class="flex-grow-1" style="cursor: pointer;" title="Click to run this query again">
                <strong class="d-block">${item.query}</strong>
                <small class="text-muted">${new Date(item.created_at).toLocaleString()}</small>
                <small class="text-muted d-block text-truncate"><i class="fas fa-database me-1"></i>${getSqlPreview(item.sql)}</small>
              </div>
              <button class="favorite-button ms-2 active" data-id="${item.id}" title="Remove from favorites">
                <i class="fas fa-star"></i>
              </button>
            </div>
          `;
          
          // Add query execute event
          favoriteItem.querySelector('.flex-grow-1').addEventListener('click', () => {
            queryTextarea.value = item.query;
            processQuery(item.query);
          });
          
          // Add keyboard accessibility
          favoriteItem.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              queryTextarea.value = item.query;
              processQuery(item.query);
            }
          });
          
          // Add favorite toggle
          favoriteItem.querySelector('.favorite-button').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(item);
            
            // Remove from display
            favoriteItem.remove();
            
            // Check if we have any favorites left
            if (favoriteQueriesContainer.children.length === 0) {
              document.getElementById('no-favorites-message').style.display = 'block';
            }
            
            // Update the history tab as well
            const historyButton = queryHistoryContainer.querySelector(`.favorite-button[data-id="${item.id}"]`);
            if (historyButton) {
              historyButton.classList.remove('active');
              historyButton.closest('.query-item').classList.remove('favorited');
            }
          });
          
          favoriteQueriesContainer.appendChild(favoriteItem);
        });
      })
      .catch(error => {
        console.error('Error fetching favorites:', error);
      });
  }
  
  // Helper function to get SQL preview
  function getSqlPreview(sql) {
    if (!sql) return '';
    
    const maxLength = 40;
    return sql.length > maxLength 
      ? sql.substring(0, maxLength) + '...' 
      : sql;
  }
  
  // Show toast notification
  function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
      toastContainer.style.zIndex = '1050';
      document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast align-items-center text-white bg-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    // Toast content
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Initialize and show toast
    const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
    bsToast.show();
    
    // Clean up after hiding
    toast.addEventListener('hidden.bs.toast', function () {
      toast.remove();
    });
  }
  
  // Show loading indicator
  function showLoading(message) {
    loadingIndicator.classList.remove('d-none');
    document.getElementById('loading-message').textContent = message || 'Loading...';
    errorContainer.classList.add('d-none');
  }
  
  // Hide loading indicator
  function hideLoading() {
    loadingIndicator.classList.add('d-none');
  }
  
  // Show error message
  function showError(message) {
    console.error('Error:', message);
    errorContainer.classList.remove('d-none');
    const errorMessageElement = errorContainer.querySelector('.error-message');
    if (errorMessageElement) {
      errorMessageElement.textContent = message;
    } else {
      errorContainer.querySelector('.alert').textContent = message;
    }
    loadingIndicator.classList.add('d-none');
    
    // Show empty state again if needed
    if (emptyStateElement && !visualizationContainer.classList.contains('d-none')) {
      emptyStateElement.classList.remove('d-none');
    }
  }
  
  // Check URL for shared report state
  function checkForSharedState() {
    const urlParams = new URLSearchParams(window.location.search);
    const stateParam = urlParams.get('state');
    
    if (stateParam) {
      try {
        const state = JSON.parse(atob(stateParam));
        
        // Set query from state
        if (state.q) {
          queryTextarea.value = state.q;
          showToast('Loading shared report...', 'info');
          setTimeout(() => {
            processQuery(state.q);
          }, 1000);
        }
        
        // Apply chart preferences from state
        if (state.chartType && chartTypeSelect) {
          chartTypeSelect.value = state.chartType;
        }
        
        if (state.colorTheme && colorThemeSelect) {
          colorThemeSelect.value = state.colorTheme;
          userPreferences.colorTheme = state.colorTheme;
        }
        
      } catch (error) {
        console.error('Error parsing shared state:', error);
        showToast('Invalid shared report link', 'error');
      }
    }
  }
  
  // Initialize the app
  fetchQueryHistory();
  displayFavorites();
  checkForSharedState();
});