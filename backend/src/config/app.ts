export const appConfig = {
    port: parseInt(process.env.PORT || '3001'),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    
    // Rate limiting
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    
    // AI services
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    
    // Razorpay
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  };
  
  export function validateAppConfig(): void {
    const warnings: string[] = [];
    
    if (appConfig.jwtSecret === 'fallback-secret-change-in-production') {
      warnings.push('⚠️  Using fallback JWT secret - set JWT_SECRET in production');
    }
    
    if (!appConfig.openaiApiKey && !appConfig.geminiApiKey) {
      warnings.push('⚠️  No AI API keys found - set OPENAI_API_KEY or GEMINI_API_KEY');
    }
    
    if (!appConfig.razorpayKeyId || !appConfig.razorpayKeySecret) {
      warnings.push('⚠️  Razorpay credentials missing - payment features will not work');
    }
    
    if (warnings.length > 0) {
      console.log('\n' + warnings.join('\n') + '\n');
    }
  }