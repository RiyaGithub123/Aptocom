import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0A0E27',
          color: 'white',
          padding: '20px',
          flexDirection: 'column'
        }}>
          <h1 style={{ color: '#FF6B35', marginBottom: '20px' }}>Something went wrong</h1>
          <details style={{
            whiteSpace: 'pre-wrap',
            backgroundColor: '#12172F',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '800px',
            overflow: 'auto'
          }}>
            <summary style={{ cursor: 'pointer', marginBottom: '10px', color: '#00FF94' }}>
              Click for error details
            </summary>
            <p style={{ color: '#EF4444', marginBottom: '10px' }}>
              {this.state.error && this.state.error.toString()}
            </p>
            <p style={{ color: '#B8B9BF', fontSize: '14px' }}>
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </p>
          </details>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#6C48FF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
