import 'dotenv/config';
import { createApp } from './app';

const port = Number(process.env.PORT ?? 4100);
const app = createApp();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.warn(`willbe-anchoring listening on port ${port}`);
});
