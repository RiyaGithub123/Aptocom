import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { toast } from 'react-toastify';
import { 
  FaUser, FaWallet, FaVoteYea, FaFileAlt, FaTrophy, 
  FaCoins, FaEdit, FaCheckCircle, FaTimesCircle,
  FaTwitter, FaGithub, FaLinkedin, FaGlobe
} from 'react-icons/fa';
import Card from '../components/Card';
import Button from '../components/Button';
import useUserBalance from '../hooks/useUserBalance';
import useProposals from '../hooks/useProposals';
import api from '../services/api';
import './Profile.css';

const Profile = () => {
  const { account, connected } = useWallet();
  const { actBalance, aptBalance } = useUserBalance();
  const { proposals } = useProposals();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const [profileData, setProfileData] = useState({
    username: '',
    bio: '',
    avatar: '',
    twitter: '',
    github: '',
    linkedin: '',
    website: ''
  });

  // Fetch user profile on mount
  useEffect(() => {
    if (connected && account?.address) {
      fetchUserProfile();
    }
  }, [connected, account]);

  const fetchUserProfile = async () => {
    try {
      const response = await api.getUserProfile(account.address);
      if (response.data) {
        setUserProfile(response.data);
        setProfileData({
          username: response.data.profile?.username || '',
          bio: response.data.profile?.bio || '',
          avatar: response.data.profile?.avatar || '',
          twitter: response.data.profile?.socialLinks?.twitter || '',
          github: response.data.profile?.socialLinks?.github || '',
          linkedin: response.data.profile?.socialLinks?.linkedin || '',
          website: response.data.profile?.socialLinks?.website || ''
        });
      }
    } catch (err) {
      // User profile doesn't exist yet
      console.log('No profile found, will create on save');
    }
  };

  const handleSaveProfile = async () => {
    if (!connected || !account) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        profile: {
          username: profileData.username,
          bio: profileData.bio,
          avatar: profileData.avatar
        },
        socialLinks: {
          twitter: profileData.twitter,
          github: profileData.github,
          linkedin: profileData.linkedin,
          website: profileData.website
        }
      };

      if (userProfile) {
        await api.updateUserProfile(account.address, payload);
        toast.success('Profile updated successfully!');
      } else {
        await api.registerUser({
          walletAddress: account.address,
          ...payload
        });
        toast.success('Profile created successfully!');
      }
      
      setEditing(false);
      fetchUserProfile();
    } catch (err) {
      console.error('Save profile error:', err);
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  // Calculate user statistics
  const userProposals = (Array.isArray(proposals) ? proposals : []).filter(p => 
    p.submittedBy?.toLowerCase() === account?.address?.toLowerCase()
  );

  const votedProposals = (Array.isArray(proposals) ? proposals : []).filter(p => {
    // In real app, check if user has voted via blockchain query
    return false; // Placeholder
  });

  const calculateVotingPower = () => {
    const totalSupply = 1000000; // Mock total supply
    if (!actBalance || actBalance <= 0) return '0.00';
    return ((actBalance / totalSupply) * 100).toFixed(4);
  };

  const badges = [
    { name: 'Early Adopter', icon: '🌟', earned: true },
    { name: 'Active Voter', icon: '🗳️', earned: votedProposals.length >= 5 },
    { name: 'Proposal Creator', icon: '📝', earned: userProposals.length >= 1 },
    { name: 'Top Contributor', icon: '🏆', earned: actBalance >= 1000 },
    { name: 'Governance Expert', icon: '⚖️', earned: votedProposals.length >= 10 },
    { name: 'Treasury Supporter', icon: '💰', earned: false }
  ];

  if (!connected) {
    return (
      <div className="profile page">
        <Card variant="default">
          <div className="empty-state">
            <FaWallet style={{ fontSize: '4rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h2>Connect Your Wallet</h2>
            <p>Please connect your wallet to view your profile and statistics.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="profile page">
      <div className="page-header">
        <h1><FaUser /> My Profile</h1>
        <p className="subtitle">
          Manage your DAO identity, track your contributions, and showcase your achievements.
        </p>
      </div>

      {/* Profile Overview */}
      <Card variant="outlined" className="profile-overview-card">
        <div className="profile-overview">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {profileData.avatar ? (
                <img src={profileData.avatar} alt="Profile" />
              ) : (
                <FaUser />
              )}
            </div>
            {editing && (
              <input
                type="text"
                name="avatar"
                value={profileData.avatar}
                onChange={handleChange}
                placeholder="Avatar URL"
                className="profile-input small"
              />
            )}
          </div>

          <div className="profile-info">
            {editing ? (
              <div className="profile-edit-form">
                <input
                  type="text"
                  name="username"
                  value={profileData.username}
                  onChange={handleChange}
                  placeholder="Username"
                  className="profile-input"
                />
                <textarea
                  name="bio"
                  value={profileData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself..."
                  className="profile-textarea"
                  rows="3"
                />
                <div className="social-inputs">
                  <input
                    type="text"
                    name="twitter"
                    value={profileData.twitter}
                    onChange={handleChange}
                    placeholder="Twitter username"
                    className="profile-input"
                  />
                  <input
                    type="text"
                    name="github"
                    value={profileData.github}
                    onChange={handleChange}
                    placeholder="GitHub username"
                    className="profile-input"
                  />
                  <input
                    type="text"
                    name="linkedin"
                    value={profileData.linkedin}
                    onChange={handleChange}
                    placeholder="LinkedIn profile URL"
                    className="profile-input"
                  />
                  <input
                    type="text"
                    name="website"
                    value={profileData.website}
                    onChange={handleChange}
                    placeholder="Website URL"
                    className="profile-input"
                  />
                </div>
              </div>
            ) : (
              <>
                <h2>{profileData.username || 'Anonymous User'}</h2>
                <p className="profile-address">{account?.address}</p>
                {profileData.bio && <p className="profile-bio">{profileData.bio}</p>}
                
                {(profileData.twitter || profileData.github || profileData.linkedin || profileData.website) && (
                  <div className="social-links">
                    {profileData.twitter && (
                      <a href={`https://twitter.com/${profileData.twitter}`} target="_blank" rel="noopener noreferrer">
                        <FaTwitter /> Twitter
                      </a>
                    )}
                    {profileData.github && (
                      <a href={`https://github.com/${profileData.github}`} target="_blank" rel="noopener noreferrer">
                        <FaGithub /> GitHub
                      </a>
                    )}
                    {profileData.linkedin && (
                      <a href={profileData.linkedin} target="_blank" rel="noopener noreferrer">
                        <FaLinkedin /> LinkedIn
                      </a>
                    )}
                    {profileData.website && (
                      <a href={profileData.website} target="_blank" rel="noopener noreferrer">
                        <FaGlobe /> Website
                      </a>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="profile-actions">
            {editing ? (
              <>
                <Button variant="secondary" onClick={handleSaveProfile} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="ghost" onClick={() => setEditing(false)} disabled={loading}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="primary" onClick={() => setEditing(true)}>
                <FaEdit /> Edit Profile
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Statistics Grid */}
      <div className="profile-stats-grid">
        <Card variant="default" hover>
          <div className="stat-card">
            <div className="stat-icon" style={{ color: 'var(--primary-green)' }}>
              <FaCoins />
            </div>
            <div className="stat-content">
              <span className="stat-label">ACT Balance</span>
              <span className="stat-value">{actBalance ? actBalance.toFixed(2) : '0.00'}</span>
            </div>
          </div>
        </Card>

        <Card variant="default" hover>
          <div className="stat-card">
            <div className="stat-icon" style={{ color: 'var(--primary-cyan)' }}>
              <FaWallet />
            </div>
            <div className="stat-content">
              <span className="stat-label">APT Balance</span>
              <span className="stat-value">{aptBalance ? aptBalance.toFixed(4) : '0.0000'}</span>
            </div>
          </div>
        </Card>

        <Card variant="default" hover>
          <div className="stat-card">
            <div className="stat-icon" style={{ color: 'var(--primary-purple)' }}>
              <FaVoteYea />
            </div>
            <div className="stat-content">
              <span className="stat-label">Voting Power</span>
              <span className="stat-value">{calculateVotingPower()}%</span>
            </div>
          </div>
        </Card>

        <Card variant="default" hover>
          <div className="stat-card">
            <div className="stat-icon" style={{ color: 'var(--primary-yellow)' }}>
              <FaFileAlt />
            </div>
            <div className="stat-content">
              <span className="stat-label">Proposals Created</span>
              <span className="stat-value">{userProposals.length}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Badges Section */}
      <Card variant="default">
        <h2><FaTrophy /> Achievements & Badges</h2>
        <div className="badges-grid">
          {badges.map((badge, i) => (
            <div key={i} className={`badge-item ${badge.earned ? 'earned' : 'locked'}`}>
              <div className="badge-icon">{badge.icon}</div>
              <div className="badge-name">{badge.name}</div>
              {badge.earned && <div className="badge-checkmark"><FaCheckCircle /></div>}
            </div>
          ))}
        </div>
      </Card>

      {/* My Proposals */}
      <Card variant="default">
        <h2><FaFileAlt /> My Proposals ({userProposals.length})</h2>
        {userProposals.length === 0 ? (
          <div className="empty-state-small">
            <p>You haven't created any proposals yet.</p>
            <Link to="/create-proposal">
              <Button variant="primary" size="small">Create Your First Proposal</Button>
            </Link>
          </div>
        ) : (
          <div className="proposals-list">
            {userProposals.slice(0, 5).map((proposal) => (
              <div key={proposal._id} className="proposal-item">
                <div className="proposal-item-header">
                  <h4>
                    <Link to={`/proposals/${proposal._id}`}>{proposal.title}</Link>
                  </h4>
                  <span className={`status-badge ${proposal.status?.toLowerCase()}`}>
                    {proposal.status}
                  </span>
                </div>
                <p className="proposal-item-meta">
                  Requested: {proposal.investmentDetails?.requestedAmount || 0} APT • 
                  AI Score: {proposal.aiEvaluation?.overallScore || 0}/100
                </p>
              </div>
            ))}
            {userProposals.length > 5 && (
              <Link to="/proposals" className="view-all-link">
                View all {userProposals.length} proposals →
              </Link>
            )}
          </div>
        )}
      </Card>

      {/* Voting History */}
      <Card variant="default">
        <h2><FaVoteYea /> Recent Voting Activity</h2>
        {votedProposals.length === 0 ? (
          <div className="empty-state-small">
            <p>You haven't voted on any proposals yet.</p>
            <Link to="/voting">
              <Button variant="secondary" size="small">Browse Active Proposals</Button>
            </Link>
          </div>
        ) : (
          <div className="voting-history">
            {votedProposals.slice(0, 5).map((proposal) => (
              <div key={proposal._id} className="vote-item">
                <div className="vote-item-header">
                  <h4>
                    <Link to={`/proposals/${proposal._id}`}>{proposal.title}</Link>
                  </h4>
                  <span className="vote-indicator for">
                    <FaCheckCircle /> Voted For
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Profile;
