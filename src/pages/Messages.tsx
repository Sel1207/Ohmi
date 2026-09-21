import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { authService, marketplaceService } from '../services';
import { useAuth } from '../hooks/useAuth';
import type { DesignerProfileView, Message, User } from '../types';
import { errorMessage } from '../utils/errors';
import { formatDate } from '../utils/format';

export function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const recipientId = searchParams.get('to');
  const [recipient, setRecipient] = useState<DesignerProfileView | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    void Promise.all([
      marketplaceService.listMessagesForUser(user.id),
      authService.listUsers(),
      recipientId ? marketplaceService.getDesignerProfile(recipientId) : Promise.resolve(null),
    ])
      .then(([messageData, userData, recipientData]) => {
        setMessages(messageData);
        setUsers(userData);
        setRecipient(recipientData);
      })
      .catch((err) => setError(errorMessage(err)));
  }, [user, recipientId]);

  if (!user) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!recipient) return;
    setSending(true);
    setError(null);
    try {
      await marketplaceService.sendMessage(user.id, recipient.user.id, body);
      setBody('');
      setMessages(await marketplaceService.listMessagesForUser(user.id));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const userName = (id: string) => users.find((item) => item.id === id)?.name ?? 'Ohmi member';

  return (
    <main className="page narrow-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Messages</p>
          <h1>{recipient ? `Message ${recipient.user.name}` : 'Your messages'}</h1>
          <p className="muted">Connect directly with designers about their work and your project needs.</p>
        </div>
      </section>

      {recipient ? (
        <form className="card stack" onSubmit={handleSubmit}>
          <div className="message-recipient">
            <Avatar name={recipient.user.name} src={recipient.user.avatarUrl} size="md" />
            <div>
              <strong>{recipient.user.name}</strong>
              <span className="muted">{recipient.headline}</span>
            </div>
          </div>
          <label className="field">
            Message
            <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={5} required placeholder="Introduce yourself or ask about their availability..." />
          </label>
          {error ? <div className="alert error">{error}</div> : null}
          <div className="action-row">
            <button className="btn btn-primary" type="submit" disabled={sending}>
              {sending ? 'Sending...' : 'Send message'}
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => navigate(-1)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <section className="card stack">
        <div className="section-title">
          <h2>Inbox and sent</h2>
          <span className="count-pill">{messages.length}</span>
        </div>
        {messages.length === 0 ? (
          <div className="empty-state">No messages yet.</div>
        ) : (
          messages.map((message) => {
            const incoming = message.recipientId === user.id;
            const otherId = incoming ? message.senderId : message.recipientId;
            return (
              <div className="message-card" key={message.id}>
                <div className="split-row">
                  <strong>{incoming ? `From ${userName(otherId)}` : `To ${userName(otherId)}`}</strong>
                  <small>{formatDate(message.createdAt)}</small>
                </div>
                <p>{message.body}</p>
              </div>
            );
          })
        )}
      </section>
    </main>
  );
}
