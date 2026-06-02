import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  console.log(`Candy API is running on http://localhost:${env.port}`);
});
