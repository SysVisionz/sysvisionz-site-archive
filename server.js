import next from "next";
import http from "node:http";
import express from "express";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { config } from 'dotenv';
import compression from "compression";
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: `${__dirname}/.env` });
const args = process.argv.slice(2);
const dev = args.some(v => v === "dev");
const test = args.some(v => v === 'test');
console.log(args.find(v => v.match(/^port=/)) || 'no port');
const port = Number(args.find(v => v.match(/^port=/))?.substring(5)) || (dev ? 8082 : test ? 8083 : 8080);
const hostname = (dev || test) ? 'localhost' : process.env.NEXT_PUBLIC_HOSTNAME;
const project = process.env.NEXT_PUBLIC_PROJECT;
const app = next({ ...(dev ? { dev } : {}), hostname, port, dir: __dirname });
const shouldCompress = (req, res) => {
    // don't compress responses asking explicitly not
    if (req.headers['x-no-compression']) {
        return false;
    }
    // use compression filter function
    return compression.filter(req, res);
};
const handler = app.getRequestHandler();
const exp = express();
exp.use(compression({ filter: shouldCompress }));
exp.all('*', (req, res) => {
    handler(req, res);
});
app.prepare().then(() => {
    const name = (dev || test) ? project : hostname;
    http.createServer(exp).listen(port, () => {
        console.log(`Listening on HTTPS port ${port}`);
    });
});
