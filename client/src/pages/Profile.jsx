import { useState } from 'react';
import api, { errMsg } from '../api';
import { useApp } from '../context/AppContext';
import { dateTime } from '../fmt';
import Tilt from '../components/Tilt';

export default function Profile() {
  const { user, setUser, toast } = useApp();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put('/auth/profile', { name, phone });
      setUser(data.user);
      toast('Profile saved');
    } catch (err) {
      toast(errMsg(err), 'error');
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    try {
      await api.put('/auth/password', pw);
      toast('Password changed');
      setPw({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast(errMsg(err), 'error');
    }
  };

  return (
    <>
      <h1 className="title">Profile</h1>
      <div className="grid two">
        <Tilt className="glass panel" max={3}>
          <div className="avatar big-avatar">{user.name[0]}</div>
          <dl className="details">
            <dt>Account number</dt>
            <dd>{user.accountNumber}</dd>
            <dt>Account type</dt>
            <dd>{user.accountType}</dd>
            <dt>IFSC</dt>
            <dd>YOUR0000001</dd>
            <dt>Email</dt>
            <dd>{user.email}</dd>
            <dt>Customer since</dt>
            <dd>{dateTime(user.createdAt)}</dd>
          </dl>
        </Tilt>

        <div className="stack">
          <form className="glass panel" onSubmit={saveProfile}>
            <h3>Personal details</h3>
            <label className="field">
              Full name
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label className="field">
              Phone
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <button className="btn primary">Save changes</button>
          </form>

          <form className="glass panel" onSubmit={savePassword}>
            <h3>Change password</h3>
            <label className="field">
              Current password
              <input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required />
            </label>
            <label className="field">
              New password
              <input type="password" minLength={6} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required />
            </label>
            <button className="btn primary">Update password</button>
          </form>
        </div>
      </div>
    </>
  );
}
