// API Response types
export interface ApiResponse<T= any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}


//User types
export interface User{
    id:string;
    email:string;
    created_at:string;
    updated_at:string;
    subscription_tier:'starter'|'power';
    prompt_credits:number;
}


// Authentication types
export interface AuthTokens {
    accessToken: string;
    refreshToken?: string;
  }

export interface JWTPayload{
    userId:string;
    email:string;
    tier:string;
    iat?:number;
    exp?:number;        
}

// payment types
export interface PaymentOrder{
    id:string;
    user_id:string;
    amount:number;
    currency:string;
    status:'created'|'paid'|'failed';
    razorpay_order_id:string;
    created_at:string;
    credits_to_add:number;
}

// Prompt enhancement types
export interface PromptRequest {
    originalText:string;
    context?:string;
    style?:'formal'|'casual'|'creative'|'technical';
}

export interface PromptResponse {
    enhancedPrompt: string;
    creditsUsed: number;
    remainingCredits: number;
    processingTime: number;
  }

  // Configuration types
export interface DatabaseConfig {
    supabaseUrl: string;
    supabaseAnonKey: string;
    supabaseServiceKey: string;
  }
export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
}  