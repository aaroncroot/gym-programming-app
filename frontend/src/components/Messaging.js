import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Messaging.css';

const Messaging = ({ user }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/messages/conversations');
      setConversations(response.data.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await axios.get(`/api/messages/conversations/${conversationId}`);
      setMessages(response.data.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;

    try {
      setSending(true);
      
      if (selectedFile) {
        // Send file
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('recipientId', getOtherParticipant(selectedConversation)._id);
        formData.append('messageType', getFileType(selectedFile.name));

        await axios.post('/api/messages/send-file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        // Send text message
        await axios.post('/api/messages/send', {
          recipientId: getOtherParticipant(selectedConversation)._id,
          content: newMessage
        });
      }

      setNewMessage('');
      await fetchMessages(selectedConversation._id);
      await fetchConversations(); // Update conversation list
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participants.find(p => p._id !== user._id);
  };

  const getFileType = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'image';
    if (['mp4', 'mov', 'avi'].includes(ext)) return 'video';
    return 'file';
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  if (loading) {
    return <div className="messaging-loading">Loading conversations...</div>;
  }

  return (
    <div className="messaging-container">
      <div className="conversations-sidebar">
        <div className="sidebar-header">
          <h3>💬 Messages</h3>
        </div>
        <div className="conversations-list">
          {conversations.map(conversation => {
            const otherParticipant = getOtherParticipant(conversation);
            return (
              <div
                key={conversation._id}
                className={`conversation-item ${selectedConversation?._id === conversation._id ? 'active' : ''}`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <div className="conversation-avatar">
                  {otherParticipant.role === 'trainer' ? '👨‍💼' : '👤'}
                </div>
                <div className="conversation-info">
                  <div className="conversation-name">
                    {otherParticipant.firstName} {otherParticipant.lastName}
                  </div>
                  <div className="conversation-preview">
                    {conversation.lastMessage?.content || 'No messages yet'}
                  </div>
                </div>
                {conversation.unreadCount > 0 && (
                  <div className="unread-badge">{conversation.unreadCount}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="chat-area">
        {selectedConversation ? (
          <>
            <div className="chat-header">
              <div className="chat-participant">
                {(() => {
                  const otherParticipant = getOtherParticipant(selectedConversation);
                  return (
                    <>
                      <span className="participant-avatar">
                        {otherParticipant.role === 'trainer' ? '👨‍💼' : '👤'}
                      </span>
                      <span className="participant-name">
                        {otherParticipant.firstName} {otherParticipant.lastName}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="messages-container">
              {messages.map((message, index) => {
                const isOwnMessage = message.sender._id === user._id;
                const showDate = index === 0 || 
                  formatDate(message.createdAt) !== formatDate(messages[index - 1]?.createdAt);

                return (
                  <div key={message._id}>
                    {showDate && (
                      <div className="date-divider">
                        {formatDate(message.createdAt)}
                      </div>
                    )}
                    <div className={`message ${isOwnMessage ? 'own' : 'other'}`}>
                      <div className="message-content">
                        {message.messageType === 'image' && (
                          <img src={message.fileUrl} alt="Shared image" className="message-image" />
                        )}
                        {message.messageType === 'video' && (
                          <video controls className="message-video">
                            <source src={message.fileUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        )}
                        {message.messageType === 'file' && (
                          <div className="message-file">
                            <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">
                              📎 {message.fileName}
                            </a>
                          </div>
                        )}
                        <div className="message-text">{message.content}</div>
                        <div className="message-time">{formatTime(message.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="message-input">
              <div className="input-actions">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  style={{ display: 'none' }}
                />
                <button 
                  className="file-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  📎
                </button>
                {selectedFile && (
                  <span className="selected-file">
                    📎 {selectedFile.name}
                    <button 
                      className="remove-file"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
              <div className="input-container">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  disabled={sending}
                />
                <button 
                  onClick={sendMessage}
                  disabled={sending || (!newMessage.trim() && !selectedFile)}
                  className="send-btn"
                >
                  {sending ? '⏳' : '📤'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="no-conversation">
            <div className="no-conversation-content">
              <h3>💬 Start a Conversation</h3>
              <p>Select a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messaging; 