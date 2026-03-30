import { createServer } from 'http';
import { app } from './dist/main';

export default createServer(app.getHttpServer());
