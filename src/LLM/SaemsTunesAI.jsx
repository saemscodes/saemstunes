import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAIFAQ, useDebouncedAIFAQ } from '@/lib/hooks/useAIFAQ';
import '@/LLM/SaemsTunesAI.css';

const SaemsTunesAI = ({ 
  position = 'bottom-right',
  defaultOpen = false,
  showFeedback = true,
  maxHeight = '600px',
  theme = 'default'
}) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [selectedModel, setSelectedModel] = useState('fast');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);
  
  const { 
    askAI, 
    isLoading, 
    error, 
    performance, 
    conversationId,
    cancelRequest,
    submitFeedback,
    clearConversation 
  } = useDebouncedAIFAQ();

  // Quick question suggestions
  const quickQuestions = [
    "How do I create a playlist?",
    "Can I upload my own music?",
    "What are the premium features?",
    "How do I follow artists?",
    "Is there a mobile app?",
    "How do I share music with friends?",
    "What music genres are available?",
    "How does the recommendation system work?"
  ];

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(scrollToBottom, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 1,
        text: "Hi! I'm your Saem's Tunes AI assistant. I can help you with platform features, music discovery, technical support, and more! What would you like to know?",
        isAI: true,
        timestamp: new Date(),
        type: 'welcome'
      }]);
    }
  }, [messages.length]);

  // Handle sending messages
  const handleSendMessage = async (question = inputValue) => {
    if (!question.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: question,
      isAI: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    try {
      const result = await askAI(question, { modelProfile: selectedModel });
      
      const aiMessage = {
        id: Date.now() + 1,
        text: result.response,
        isAI: true,
        timestamp: new Date(),
        processingTime: result.processingTime,
        modelUsed: result.modelUsed
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm having trouble connecting right now. Please try again in a moment.",
        isAI: true,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Handle quick question selection
  const handleQuickQuestion = (question) => {
    setInputValue(question);
    handleSendMessage(question);
  };

  // Handle feedback submission
  const handleFeedback = (messageId, helpful) => {
    submitFeedback(conversationId, helpful, `Message ${messageId}`);
    // Show feedback confirmation
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, feedback: helpful } : msg
    ));
  };

  // Clear conversation
  const handleClearConversation = () => {
    clearConversation();
    setMessages([{
      id: 1,
      text: "Conversation cleared. What would you like to know about Saem's Tunes?",
      isAI: true,
      timestamp: new Date()
    }]);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  return (
    <div className={`saems-ai-container ${theme} ${position}`}>
      {/* Floating toggle button */}
      <button
        className={`ai-toggle-btn ${isOpen ? 'open' : ''} ${isLoading ? 'loading' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="AI Assistant"
      >
        {isLoading ? (
          <div className="loading-spinner"></div>
        ) : isOpen ? (
          '✕'
        ) : (
          '🎵'
        )}
        {!isOpen && messages.length > 1 && (
          <span className="notification-dot"></span>
        )}
      </button>

      {/* Chat interface */}
      {isOpen && (
        <div className="ai-chat-interface" style={{ maxHeight }}>
          {/* Header */}
          <div className="chat-header">
            <div className="header-info">
              <h3>🎵 Saem's Tunes AI</h3>
              <span className="status-indicator online"></span>
            </div>
            <div className="header-actions">
              <button 
                className="icon-btn"
                onClick={() => setShowSettings(!showSettings)}
                title="Settings"
              >
                ⚙️
              </button>
              <button 
                className="icon-btn"
                onClick={handleClearConversation}
                title="Clear chat"
              >
                🗑️
              </button>
              <button 
                className="icon-btn"
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Settings panel */}
          {showSettings && (
            <div className="settings-panel">
              <div className="setting-group">
                <label>Model:</label>
                <select 
                  value={selectedModel} 
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  <option value="fast">Fast (Q4_K_M)</option>
                  <option value="balanced">Balanced (Q5_K_M)</option>
                  <option value="quality">Quality (Q8_0)</option>
                </select>
              </div>
              <div className="performance-stats">
                <div>Avg. Response: {performance.averageResponseTime?.toFixed(0) || '0'}ms</div>
                <div>Total Requests: {performance.totalRequests || '0'}</div>
              </div>
            </div>
          )}

          {/* Messages container */}
          <div className="messages-container">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.isAI ? 'ai-message' : 'user-message'} ${message.isError ? 'error' : ''}`}>
                <div className="message-content">
                  <div className="message-text">{message.text}</div>
                  
                  {/* Message metadata */}
                  <div className="message-meta">
                    <span className="timestamp">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {message.processingTime && (
                      <span className="processing-time">
                        {message.processingTime.toFixed(0)}ms
                      </span>
                    )}
                    {message.modelUsed && (
                      <span className="model-used">
                        {message.modelUsed}
                      </span>
                    )}
                  </div>

                  {/* Feedback buttons for AI messages */}
                  {message.isAI && showFeedback && !message.isError && (
                    <div className="feedback-buttons">
                      <span>Helpful?</span>
                      <button 
                        className={`feedback-btn ${message.feedback === true ? 'active' : ''}`}
                        onClick={() => handleFeedback(message.id, true)}
                      >
                        👍
                      </button>
                      <button 
                        className={`feedback-btn ${message.feedback === false ? 'active' : ''}`}
                        onClick={() => handleFeedback(message.id, false)}
                      >
                        👎
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="message ai-message">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick questions */}
          {messages.length <= 2 && (
            <div className="quick-questions">
              <p>Quick questions:</p>
              <div className="quick-buttons">
                {quickQuestions.slice(0, 4).map((question, index) => (
                  <button
                    key={index}
                    className="quick-question-btn"
                    onClick={() => handleQuickQuestion(question)}
                    disabled={isLoading}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="input-area">
            <div className="input-container">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask about Saem's Tunes..."
                disabled={isLoading}
                className="message-input"
              />
              
              <div className="input-actions">
                {isLoading ? (
                  <button 
                    className="action-btn cancel-btn"
                    onClick={cancelRequest}
                    title="Cancel request"
                  >
                    ⏹️
                  </button>
                ) : (
                  <button 
                    className="action-btn send-btn"
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim()}
                    title="Send message"
                  >
                    ➤
                  </button>
                )}
              </div>
            </div>
            
            {/* Input hints */}
            <div className="input-hints">
              <span>Press Enter to send • Ctrl+K to toggle</span>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="error-banner">
              <span>Connection issue: {error}</span>
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SaemsTunesAI;
