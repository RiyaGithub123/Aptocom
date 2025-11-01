import React, { useEffect, useRef } from 'react';
import { FaChartLine, FaChartPie, FaChartBar, FaTrophy } from 'react-icons/fa';
import Card from '../components/Card';
import useAnalytics from '../hooks/useAnalytics';
import './Analytics.css';

const Analytics = () => {
  const { data: analytics, loading } = useAnalytics();
  const chartRef = useRef(null);

  // Mock additional data for rich analytics
  const sectorData = [
    { name: 'Technology', value: 35, color: 'var(--primary-purple)' },
    { name: 'Healthcare', value: 25, color: 'var(--primary-green)' },
    { name: 'Finance', value: 20, color: 'var(--primary-cyan)' },
    { name: 'Energy', value: 15, color: 'var(--primary-yellow)' },
    { name: 'Other', value: 5, color: 'var(--text-muted)' }
  ];

  const performanceMetrics = [
    { label: 'Total ROI', value: '+24.5%', trend: 'up', icon: FaChartLine },
    { label: 'Success Rate', value: '78%', trend: 'up', icon: FaTrophy },
    { label: 'Avg. Investment', value: '125 APT', trend: 'stable', icon: FaChartBar },
    { label: 'Active Investments', value: '12', trend: 'up', icon: FaChartPie }
  ];

  const recentInvestments = [
    { name: 'AI Healthcare Platform', sector: 'Healthcare', amount: 250, roi: '+32%', status: 'success' },
    { name: 'DeFi Lending Protocol', sector: 'Finance', amount: 180, roi: '+18%', status: 'success' },
    { name: 'Green Energy Startup', sector: 'Energy', amount: 150, roi: '+12%', status: 'active' },
    { name: 'EdTech Platform', sector: 'Education', amount: 100, roi: 'Pending', status: 'pending' }
  ];

  const monthlyData = [
    { month: 'May', investments: 3, returns: 450 },
    { month: 'Jun', investments: 4, returns: 680 },
    { month: 'Jul', investments: 2, returns: 320 },
    { month: 'Aug', investments: 5, returns: 890 },
    { month: 'Sep', investments: 3, returns: 550 },
    { month: 'Oct', investments: 4, returns: 720 }
  ];

  useEffect(() => {
    // Simple bar chart rendering
    if (chartRef.current && !loading) {
      const ctx = chartRef.current.getContext('2d');
      const width = chartRef.current.width;
      const height = chartRef.current.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw bars
      const barWidth = width / monthlyData.length;
      const maxValue = Math.max(...monthlyData.map(d => d.returns));
      
      monthlyData.forEach((data, i) => {
        const barHeight = (data.returns / maxValue) * (height - 40);
        const x = i * barWidth;
        const y = height - barHeight - 20;
        
        // Draw bar
        const gradient = ctx.createLinearGradient(0, y, 0, height);
        gradient.addColorStop(0, '#8a49f4');
        gradient.addColorStop(1, '#00d4ff');
        ctx.fillStyle = gradient;
        ctx.fillRect(x + 10, y, barWidth - 20, barHeight);
        
        // Draw month label
        ctx.fillStyle = '#888';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(data.month, x + barWidth / 2, height - 5);
      });
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="analytics page">
        <div className="page-header">
          <h1>Loading analytics...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics page">
      <div className="page-header">
        <h1>📊 Analytics Dashboard</h1>
        <p className="subtitle">
          Track DAO performance, investment metrics, and portfolio distribution across sectors.
        </p>
      </div>

      <div className="performance-grid">
        {performanceMetrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <Card key={i} variant="default" hover>
              <div className="performance-card">
                <div className="performance-icon" style={{ 
                  color: i === 0 ? 'var(--primary-green)' : 
                         i === 1 ? 'var(--primary-yellow)' : 
                         i === 2 ? 'var(--primary-cyan)' : 
                         'var(--primary-purple)' 
                }}>
                  <Icon />
                </div>
                <div className="performance-content">
                  <span className="performance-label">{metric.label}</span>
                  <span className="performance-value">{metric.value}</span>
                  {metric.trend === 'up' && <span className="trend up">↑</span>}
                  {metric.trend === 'down' && <span className="trend down">↓</span>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="analytics-grid">
        <Card variant="default">
          <h2>📈 Monthly Returns</h2>
          <div className="chart-container">
            <canvas ref={chartRef} width="600" height="300"></canvas>
          </div>
          <div className="chart-legend">
            <span>Investment returns over the last 6 months (APT)</span>
          </div>
        </Card>

        <Card variant="outlined">
          <h2>🎯 Sector Distribution</h2>
          <div className="sector-list">
            {sectorData.map((sector, i) => (
              <div key={i} className="sector-item">
                <div className="sector-info">
                  <span className="sector-name">{sector.name}</span>
                  <span className="sector-value">{sector.value}%</span>
                </div>
                <div className="sector-bar-container">
                  <div 
                    className="sector-bar" 
                    style={{ 
                      width: `${sector.value}%`,
                      background: sector.color,
                      boxShadow: `0 0 10px ${sector.color}40`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card variant="default">
        <h2>💼 Recent Investments</h2>
        <div className="investments-table">
          <div className="table-header">
            <span>Project</span>
            <span>Sector</span>
            <span>Amount</span>
            <span>ROI</span>
            <span>Status</span>
          </div>
          {recentInvestments.map((inv, i) => (
            <div key={i} className="table-row">
              <span className="project-name">{inv.name}</span>
              <span className="sector-tag">{inv.sector}</span>
              <span className="amount">{inv.amount} APT</span>
              <span className={`roi ${inv.roi.startsWith('+') ? 'positive' : ''}`}>
                {inv.roi}
              </span>
              <span className={`status-badge ${inv.status}`}>
                {inv.status === 'success' && '✓ Success'}
                {inv.status === 'active' && '⏳ Active'}
                {inv.status === 'pending' && '⏸ Pending'}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <div className="insights-grid">
        <Card variant="success">
          <h3>💡 Key Insights</h3>
          <ul className="insights-list">
            <li>Technology sector shows highest returns at +32% average ROI</li>
            <li>Portfolio diversification across 5 major sectors reduces risk</li>
            <li>78% success rate indicates strong AI evaluation performance</li>
            <li>Monthly returns trending upward with consistent growth</li>
          </ul>
        </Card>

        <Card variant="outlined">
          <h3>🎯 Recommendations</h3>
          <ul className="insights-list">
            <li>Consider increasing allocation to Healthcare sector</li>
            <li>Monitor Energy sector investments for emerging opportunities</li>
            <li>Maintain current diversification strategy</li>
            <li>Review underperforming investments quarterly</li>
          </ul>
        </Card>
      </div>

      <Card variant="default">
        <h2>📊 DAO Statistics</h2>
        <div className="dao-stats-grid">
          <div className="dao-stat-item">
            <span className="stat-label">Total Proposals</span>
            <span className="stat-value">{analytics?.totalProposals || 0}</span>
          </div>
          <div className="dao-stat-item">
            <span className="stat-label">Active Members</span>
            <span className="stat-value">{analytics?.activeMembers || 0}</span>
          </div>
          <div className="dao-stat-item">
            <span className="stat-label">Total Votes Cast</span>
            <span className="stat-value">{analytics?.totalVotes || 0}</span>
          </div>
          <div className="dao-stat-item">
            <span className="stat-label">Treasury Value</span>
            <span className="stat-value">{analytics?.treasuryValue || 0} APT</span>
          </div>
          <div className="dao-stat-item">
            <span className="stat-label">Success Rate</span>
            <span className="stat-value">{analytics?.successRate || 0}%</span>
          </div>
          <div className="dao-stat-item">
            <span className="stat-label">Avg. Participation</span>
            <span className="stat-value">{analytics?.avgParticipation || 0}%</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Analytics;
