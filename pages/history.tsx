import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { ChatSession } from '../types';

export default function History() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch('/api/sessions');
        const data = await response.json();
        setSessions(data.sessions);
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Chat History</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card">
                <div className="h-4 w-1/4 skeleton rounded mb-4" />
                <div className="h-4 w-3/4 skeleton rounded" />
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 text-text-secondary mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-text-secondary">No chat history yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map(session => (
              <div key={session.id} className="card hover:cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold mb-1">
                      Chat Session
                    </h3>
                    <p className="text-text-secondary text-sm">
                      {new Date(session.createdAt).toLocaleDateString()} at{' '}
                      {new Date(session.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <span className="badge">
                    {session.messages.length} messages
                  </span>
                </div>

                <div className="space-y-2">
                  {session.messages.slice(0, 2).map(message => (
                    <div
                      key={message.id}
                      className={`text-sm ${
                        message.role === 'user'
                          ? 'text-text'
                          : 'text-text-secondary'
                      }`}
                    >
                      <span className="font-medium">
                        {message.role === 'user' ? 'You: ' : 'Assistant: '}
                      </span>
                      {message.content.length > 100
                        ? `${message.content.substring(0, 100)}...`
                        : message.content}
                    </div>
                  ))}
                  {session.messages.length > 2 && (
                    <p className="text-text-secondary text-sm">
                      {session.messages.length - 2} more messages
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
} 