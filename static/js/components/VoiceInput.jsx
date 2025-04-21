import React, { useState, useEffect } from 'react';

const VoiceInput = ({ onQueryComplete, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  
  // Initialize speech recognition when component mounts
  useEffect(() => {
    // Check if browser supports speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        const current = event.resultIndex;
        const transcriptResult = event.results[current][0].transcript;
        setTranscript(transcriptResult);
      };
      
      recognitionInstance.onend = () => {
        setIsRecording(false);
        
        // Submit the final transcript if it's not empty
        if (transcript.trim() && !isProcessing) {
          onQueryComplete(transcript);
        }
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };
      
      setRecognition(recognitionInstance);
    } else {
      setIsSupported(false);
    }
    
    // Clean up the recognition object when component unmounts
    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, []);
  
  // Update onend handler when transcript changes
  useEffect(() => {
    if (recognition) {
      recognition.onend = () => {
        setIsRecording(false);
        
        // Submit the final transcript if it's not empty
        if (transcript.trim() && !isProcessing) {
          onQueryComplete(transcript);
        }
      };
    }
  }, [transcript, onQueryComplete, isProcessing]);
  
  // Toggle recording state
  const toggleRecording = () => {
    if (!isSupported || isProcessing) return;
    
    if (isRecording) {
      recognition.stop();
    } else {
      setTranscript('');
      recognition.start();
      setIsRecording(true);
    }
  };
  
  // Handle manual submission of transcript
  const handleSubmit = () => {
    if (transcript.trim() && !isProcessing) {
      onQueryComplete(transcript);
    }
  };
  
  if (!isSupported) {
    return (
      <div className="alert alert-warning">
        <i className="fas fa-exclamation-triangle me-2"></i>
        Speech recognition is not supported in your browser. Please try Chrome or Edge.
      </div>
    );
  }
  
  return (
    <div className="voice-input-section">
      <div className="d-flex flex-column align-items-center mb-3">
        <button 
          className={`mic-button btn ${isRecording ? 'btn-danger recording' : 'btn-outline-primary'} mb-2`}
          onClick={toggleRecording}
          disabled={isProcessing}
          title={isRecording ? 'Stop recording' : 'Start recording'}
        >
          <i className={`fas fa-microphone${isRecording ? '-slash' : ''} fa-lg`}></i>
        </button>
        <small className="text-muted">
          {isRecording ? 'Listening...' : 'Click to speak'}
        </small>
      </div>
      
      <div className="mb-3">
        <textarea
          className="form-control"
          placeholder="Your query will appear here..."
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={3}
          disabled={isRecording || isProcessing}
        />
      </div>
      
      <div className="d-grid gap-2">
        <button 
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!transcript.trim() || isProcessing}
        >
          <i className="fas fa-paper-plane me-2"></i>
          Send Query
        </button>
      </div>
    </div>
  );
};

export default VoiceInput;
