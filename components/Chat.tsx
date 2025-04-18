import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Venue } from '../types';

interface ChatProps {
  sessionId?: string;
}

export default function Chat({ sessionId }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [venues, setVenues] = useState<Venue[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: input,
          sessionId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setVenues(data.venues || []);
    } catch (error) {
      console.error('Chat error:', error);
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-surface'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <span className="text-xs text-text-secondary mt-2 block">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-surface rounded-lg p-4 max-w-[70%]">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {venues.length > 0 && (
        <div className="p-4 border-t border-border">
          <h3 className="text-lg font-semibold mb-4">Suggested Venues</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {venues.map(venue => (
              <div key={venue.id} className="card">
                <div className="aspect-video bg-surface-light rounded-lg mb-4">
                  {venue.photos[0] ? (
                    <img
                      src={venue.photos[0]}
                      alt={venue.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg
                        className="w-12 h-12 text-text-secondary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <h4 className="font-semibold mb-2">{venue.name}</h4>
                <p className="text-text-secondary text-sm mb-2">
                  {venue.address}
                </p>
                <div className="flex items-center space-x-2 mb-4">
                  <span className="badge">
                    {venue.rating.toFixed(1)} ★
                  </span>
                  <span className="badge">{venue.priceRange}</span>
                  <span className="badge">
                    Up to {venue.capacity} people
                  </span>
                </div>
                <div className="flex space-x-2">
                  <a
                    href={venue.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button secondary flex-1"
                  >
                    View Map
                  </a>
                  {venue.bookingUrl && (
                    <a
                      href={venue.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button flex-1"
                    >
                      Book Now
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about venues or places you'd like to discover..."
            className="input flex-grow"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="button"
            disabled={isLoading || !input.trim()}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
} 