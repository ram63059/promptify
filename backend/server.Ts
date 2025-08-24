import app from './app'

import {config} from './config/database'

const PORT =process.env.PORT || 3001;


async function startServer(): Promise<void>{
    try {
        // Test database connection
    console.log('🔌 Testing database connection...');

    app.listen(PORT ,()=>{
        console.log(`🚀 Promptify Backend running on port ${PORT}`);

    })
    } catch (error) {
        console.error('failed to start server',error)
        process.exit(1)
    }
}

// Graceful shutdown

process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received, shutting down gracefully');
    process.exit(0);
  });
  
process.on('SIGINT', () => {
    console.log('👋 SIGINT received, shutting down gracefully');
    process.exit(0);
  });
  
startServer();