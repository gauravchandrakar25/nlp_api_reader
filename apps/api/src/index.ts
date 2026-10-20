import { createServer } from './server';
import { config } from './config';

const app = createServer();

app.listen(config.port, () => {
  console.log(`🚀 REA Secure API Gateway running at http://localhost:${config.port}`);
  console.log(`📋 Health Check: http://localhost:${config.port}/api/health`);
  console.log(`🔒 Natural Language Endpoint: POST http://localhost:${config.port}/api/execute-nl`);
});
