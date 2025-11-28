import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-8">
          <div className="max-w-2xl w-full bg-gray-800 rounded-lg shadow-xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-6xl">⚠️</div>
              <div>
                <h1 className="text-3xl font-bold text-red-400">Произошла ошибка</h1>
                <p className="text-gray-400 mt-2">
                  Что-то пошло не так. Попробуйте перезагрузить приложение.
                </p>
              </div>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-6 space-y-4">
                <div className="bg-gray-900 rounded p-4 font-mono text-sm">
                  <div className="text-red-400 font-semibold mb-2">Ошибка:</div>
                  <div className="text-gray-300 whitespace-pre-wrap">
                    {this.state.error.toString()}
                  </div>
                </div>

                {this.state.errorInfo && (
                  <div className="bg-gray-900 rounded p-4 font-mono text-sm max-h-64 overflow-auto">
                    <div className="text-red-400 font-semibold mb-2">Stack trace:</div>
                    <div className="text-gray-400 text-xs whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 flex gap-4">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
              >
                Попробовать снова
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
              >
                Перезагрузить приложение
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
