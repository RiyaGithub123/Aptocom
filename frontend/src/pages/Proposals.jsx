import React from 'react';
import { Link } from 'react-router-dom';
import useProposals from '../hooks/useProposals';
import Card from '../components/Card';
import Button from '../components/Button';
import './Proposals.css';

const Proposals = () => {
	const { proposals, loading, error, refetch } = useProposals();

	const getStatusBadge = (status) => {
		const statusLower = (status || 'pending').toLowerCase();
		return <span className={`status-badge ${statusLower}`}>{status || 'Pending'}</span>;
	};

	const getStatusColor = (status) => {
		const statusLower = (status || 'pending').toLowerCase();
		switch (statusLower) {
			case 'approved':
			case 'active':
				return 'success';
			case 'rejected':
				return 'danger';
			case 'pending':
				return 'warning';
			default:
				return 'default';
		}
	};

	return (
		<div className="proposals page">
			<div className="page-header">
				<h1>Proposals</h1>
				<p className="subtitle">Browse community investment proposals and participate in DAO governance voting.</p>
			</div>

			<div className="proposals-actions">
				<Link to="/create-proposal">
					<Button variant="warning" size="large">+ Create Proposal</Button>
				</Link>
				<Button variant="ghost" onClick={refetch} disabled={loading}>
					{loading ? 'Refreshing...' : 'Refresh'}
				</Button>
			</div>

			{loading && (
				<div className="loading-skeleton">
					<p>Loading proposals...</p>
				</div>
			)}
			
			{error && (
				<p className="error">
					Failed to load proposals: {error}
				</p>
			)}

			{!loading && !error && (
				<div className="proposals-grid">
					{proposals && proposals.length > 0 ? (
						proposals.map((p, index) => (
							<Card key={p.id || index} variant={getStatusColor(p.status)} hover>
								<div style={{ marginBottom: '1rem' }}>
									{getStatusBadge(p.status)}
								</div>
								
								<h3>{p.title || `Proposal #${p.id || index + 1}`}</h3>
								
								<p className="muted">
									By {p.submitter || p.author || p.creator || 'Anonymous'}
								</p>
								
								<p>
									{p.summary || p.description?.slice(0, 180) || 'No description available'}
									{(p.description?.length > 180) && '...'}
								</p>
								
								<div className="proposal-meta">
									<div>
										<strong>Requested:</strong>{' '}
										{p.requestedAmount || p.fundingAmount || p.amount || '—'} APT
									</div>
									{p.aiScore !== undefined && (
										<div>
											<strong>AI Score:</strong> {p.aiScore}/100
										</div>
									)}
								</div>
								
								<div style={{ marginTop: '1rem' }}>
									<Link to={`/proposals/${p.id || index}`}>
										<Button variant="outline" size="small" fullWidth>
											View Details →
										</Button>
									</Link>
								</div>
							</Card>
						))
					) : (
						<div className="empty-state">
							<h3>No Proposals Yet</h3>
							<p>Be the first to submit an investment proposal to the DAO!</p>
							<Link to="/create-proposal">
								<Button variant="primary" size="large">Create First Proposal</Button>
							</Link>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default Proposals;
