import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAIFAQ, useDebouncedAIFAQ } from '@/lib/hooks/useAIFAQ';
import '@/LLM/SaemsTunesAI.css';

interface Message {
  id: number;
  text: string;
  isAI: boolean;
  timestamp: Date;
  processingTime?: number;
  modelUsed?: string;
  isError?: boolean;
  feedback?: boolean;
  type?: string;
}

interface Props {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  defaultOpen?: boolean;
  showFeedback?: boolean;
  maxHeight?: string;
  theme?: string;
}

const SaemsTunesAI: React.FC<Props> = ({
  position = 'bottom-right',
  defaultOpen = false,
  showFeedback = true,
  maxHeight = '600px',
  theme = 'default'
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [selectedModel, setSelectedModel] = useState('TinyLlama-1.1B-Chat');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    askAI, 
    isLoading, 
    error, 
    performance, 
    conversationId,
    cancelRequest,
    submitFeedback,
    clearConversation 
  } = useDebouncedAIFAQ() as any;

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

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(scrollToBottom, [messages]);

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

  const handleSendMessage = async (question = inputValue) => {
    if (!question.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      text: question,
      isAI: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    try {
      const modelConfigs = {
        'TinyLlama-1.1B-Chat': {
          model_name: "TinyLlama-1.1B-Chat",
          model_repo: "TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF",
          model_file: "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf",
          max_response_length: 200,
          temperature: 0.7,
          top_p: 0.9,
          context_window: 2048
        },
        'Phi-2': {
          model_name: "Phi-2",
          model_repo: "TheBloke/phi-2-GGUF",
          model_file: "phi-2.Q4_K_M.gguf",
          max_response_length: 250,
          temperature: 0.7,
          top_p: 0.9,
          context_window: 2048
        },
        'Qwen-1.8B-Chat': {
          model_name: "Qwen-1.8B-Chat",
          model_repo: "TheBloke/Qwen1.5-1.8B-Chat-GGUF",
          model_file: "qwen1.5-1.8b-chat-q4_k_m.gguf",
          max_response_length: 300,
          temperature: 0.7,
          top_p: 0.9,
          context_window: 4096
        }
      };

      const config = modelConfigs[selectedModel as keyof typeof modelConfigs] || modelConfigs['TinyLlama-1.1B-Chat'];
      
      const result = await askAI(question, { 
        modelProfile: selectedModel,
        ...config
      });
      
      const aiMessage: Message = {
        id: Date.now() + 1,
        text: result.response,
        isAI: true,
        timestamp: new Date(),
        processingTime: result.processingTime,
        modelUsed: result.modelUsed
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: "I'm having trouble connecting right now. Please try again in a moment.",
        isAI: true,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
    handleSendMessage(question);
  };

  const handleFeedback = (messageId: number, helpful: boolean) => {
    submitFeedback(conversationId, helpful, `Message ${messageId}`);
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, feedback: helpful } : msg
    ));
  };

  const handleClearConversation = () => {
    clearConversation();
    setMessages([{
      id: 1,
      text: "Conversation cleared. What would you like to know about Saem's Tunes?",
      isAI: true,
      timestamp: new Date()
    }]);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
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

      {isOpen && (
        <div className="ai-chat-interface" style={{ maxHeight }}>
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

          {showSettings && (
            <div className="settings-panel">
              <div className="setting-group">
                <label>AI Model:</label>
                <select 
                  value={selectedModel} 
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  <option value="TinyLlama-1.1B-Chat">TinyLlama (Fastest)</option>
                  <option value="Phi-2">Phi-2 (Balanced)</option>
                  <option value="Qwen-1.8B-Chat">Qwen-1.8B (Conversational)</option>
                </select>
              </div>
              <div className="performance-stats">
                <div>Avg. Response: {performance?.averageResponseTime?.toFixed(0) || '0'}ms</div>
                <div>Total Requests: {performance?.totalRequests || '0'}</div>
                <div>Model: {selectedModel}</div>
              </div>
            </div>
          )}

          <div className="messages-container">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.isAI ? 'ai-message' : 'user-message'} ${message.isError ? 'error' : ''}`}>
                <div className="message-content">
                  <div className="message-text">{message.text}</div>
                  
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
            
            <div className="input-hints">
              <span>Press Enter to send • Ctrl+K to toggle</span>
            </div>
          </div>

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
