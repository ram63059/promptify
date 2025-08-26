import express , {Application ,Request ,Response ,NextFunction} from 'express';
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";


// Load environment variables
dotenv.config();

const app: Application = express();

app.use(helmet());
app.use(cors({
    origin:process.env.FRONTEND_URL || "http://localhost:5173",
    credentials:true
}));


app.use(compression());
app.use(express.json({limit:"10mb"}));
app.use(express.urlencoded({extended:true,limit:"10mb"}));


// Request logging middleware
app.use((req:Request , res:Response ,next:NextFunction)=>{
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

//basic route for testing

app.get('/',(req:Request ,res:Response)=>{
    res.json({
        message: '🚀 Promptify API Server',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          api: '/api',
          docs: '/api/docs'
        }
    })
})

app.get('/health',(req:Request,res:Response)=>{
    res.json({
        status:'healthy',
        timestamp:new Date().toISOString(),
        uptime:process.uptime(),
        memoryUsage:process.memoryUsage(),
        environment:process.env.NODE_ENV || 'development',

    });
});

// 404 handler (catch-all for unmatched routes)
app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Route not found',
      message: `Cannot ${req.method} ${req.originalUrl}`,
      availableEndpoints: ['/', '/health', '/api']
    });
  });

  // Error handling middleware
app.use((err: Error, req: Request, res: Response, next: Function) => {
    console.error('❌ Error:', err.stack);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  });
  
  export default app;