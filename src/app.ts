import express from 'express';
import { createServer } from 'http';
import path from 'path';

import { router as healthRouter } from './routes/health';
import { router as viewerRouter } from './routes/viewer';
import { setupSockets } from './sockets';

process.env['MKPV_PORT'] = process.env['MKPV_PORT'] ?? '31622'

const app = express()
app.use(express.json());
app.use((req, res, next) => {
    res.locals.filepath = req.path
        .replace(/^\/(viewer|health)/, '')
        .replace(/^.*~/, process.env['HOME']!);
    next();
});
app.use('/static', express.static(path.join(__dirname, '../static')));
app.use('/health', healthRouter);
app.use('/viewer', viewerRouter);

const server = createServer(app);

server.listen(process.env['MKPV_PORT'], () => {
    console.log(`App is listening on port ${process.env['MKPV_PORT']}!`)
})

let shutdownTimer: NodeJS.Timer | null = null
export const { clientsAt, messageClientsAt } = setupSockets(
    server,
    () => {
        const timeout = parseInt(process.env['MKPV_TIMEOUT'] ?? '10000')
        if (timeout > 0) shutdownTimer = setInterval(() => {
            console.log(`No clients for ${timeout}ms, shutting down.`)
            process.exit(0)
        }, timeout);
    },
    () => { if (shutdownTimer) clearInterval(shutdownTimer); }
);
