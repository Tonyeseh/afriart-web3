import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import swaggerUi from 'swagger-ui-express';
import { logger } from './config/logger';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import artistRoutes from './routes/artist.routes';
import nftRoutes from './routes/nft.routes';
import uploadRoutes from './routes/upload.routes';
import adminRoutes from './routes/admin.routes';
import purchaseRoutes from './routes/purchase.routes';
import salesRoutes from './routes/sales.routes';

// Load environment variables
dotenv.config({ path: '../' });

const app: Application = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AfriArt API Documentation',
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/nfts', nftRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', salesRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
httpServer.listen(PORT, () => {
  logger.info(`🚀 AfriArt Backend running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export { app, httpServer };
