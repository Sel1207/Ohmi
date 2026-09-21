import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { useAuth } from '../hooks/useAuth';
import { errorMessage } from '../utils/errors';

export function EditProfile() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? '');
  const [location, setLocation] = useState(user?.location ?? '');
  const [specialties, setSpecialties] = useState(user?.specialties.join(', ') ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Profile pictures must be 2 MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        setError(null);
      }
    };
    reader.onerror = () => setError('The profile picture could not be read.');
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        name,
        location,
        specialties: specialties.split(','),
        avatarUrl,
      });
      navigate('/profile');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="page narrow-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Edit profile</h1>
          <p className="muted">Keep your public profile current so clients and designers know who they are working with.</p>
        </div>
      </section>

      <form className="card stack" onSubmit={handleSubmit}>
        <div className="profile-editor-preview">
          <Avatar name={user.name} src={avatarUrl} size="lg" />
          <div>
            <strong>{user.name}</strong>
            <p className="muted">Upload a profile picture. A white silhouette is used until you add one.</p>
          </div>
        </div>
        <label className="field">
          Profile picture
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarChange} />
          <span className="help-text">PNG, JPG, or WebP up to 2 MB. The image is stored in this browser for this prototype.</span>
        </label>
        {avatarUrl ? (
          <button className="btn btn-secondary profile-remove-photo" type="button" onClick={() => setAvatarUrl('')}>
            Remove profile picture
          </button>
        ) : null}
        <label className="field">
          Full name
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="field">
          Location
          <input value={location} onChange={(event) => setLocation(event.target.value)} />
        </label>
        <label className="field">
          Specialties
          <input value={specialties} onChange={(event) => setSpecialties(event.target.value)} placeholder="Load calculation, panel schedules" />
          <span className="help-text">Separate specialties with commas.</span>
        </label>
        {error ? <div className="alert error">{error}</div> : null}
        <div className="action-row">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save profile'}
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
