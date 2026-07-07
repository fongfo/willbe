import dotenv from 'dotenv';
import { createApp } from './app';

dotenv.config();

const port = Number(process.env.PORT ?? 4200);
const app = createApp();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.warn(`Willbe AI service listening on port ${port}`);
});
