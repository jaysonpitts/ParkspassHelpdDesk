import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

// Socket context
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

// Socket provider props
interface SocketProviderProps {
  children: ReactNode;
}

// Socket provider component
export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create the socket instance
    const socketInstance = io({
      path: '/socket.io',
      autoConnect: true,
      auth: {
        userId: 1, // This would normally come from authentication
      },
    });

    // Set up event listeners
    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Store the socket instance
    setSocket(socketInstance);

    // Clean up
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Create a context value object
  const contextValue: SocketContextType = {
    socket,
    isConnected
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}

// Custom hook to use the socket
export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

// Custom hook for joining and leaving a ticket room
export function useTicketRoom(ticketId?: number) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !ticketId) return;

    // Join the ticket room
    socket.emit('join-ticket', ticketId);

    // Clean up when unmounting
    return () => {
      socket.emit('leave-ticket', ticketId);
    };
  }, [socket, ticketId]);

  // Function to send a message to the ticket
  const sendMessage = (content: string) => {
    if (!socket || !ticketId) return;
    
    socket.emit('ticket-message', {
      ticketId,
      content,
    });
  };

  // Function to update ticket status
  const updateStatus = (status: 'open' | 'pending' | 'solved') => {
    if (!socket || !ticketId) return;
    
    socket.emit('update-ticket-status', {
      ticketId,
      status,
    });
  };

  return {
    sendMessage,
    updateStatus,
  };
}

// Custom hook for AI chat sessions
export function useAIChat(sessionId: string) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<Array<{ content: string, isFromUser: boolean }>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');

  useEffect(() => {
    if (!socket) return;

    // Set up event listeners for AI chat
    const handleMessageChunk = (data: { content: string, done: boolean, sessionId: string }) => {
      if (data.sessionId !== sessionId) return;
      
      if (data.done) {
        // Add the complete message to the messages array
        setMessages(prev => [...prev, { content: currentResponse, isFromUser: false }]);
        setCurrentResponse('');
        setIsTyping(false);
      } else {
        // Append to the current response
        setCurrentResponse(prev => prev + data.content);
        setIsTyping(true);
      }
    };

    socket.on('ai-message-chunk', handleMessageChunk);

    // Clean up
    return () => {
      socket.off('ai-message-chunk', handleMessageChunk);
    };
  }, [socket, sessionId, currentResponse]);

  // Function to send a message to the AI
  const sendMessage = (message: string) => {
    if (!socket) return;
    
    // Add user message to messages
    setMessages(prev => [...prev, { content: message, isFromUser: true }]);
    
    // Send to server
    socket.emit('ai-message', {
      message,
      sessionId,
    });
  };

  return {
    messages,
    sendMessage,
    isTyping,
    currentResponse,
  };
}