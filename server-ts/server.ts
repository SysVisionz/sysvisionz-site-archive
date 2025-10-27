import fs from "node:fs";
import next from "next";
import spdy from "spdy";
import express, { Request, Response } from "express";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { config } from 'dotenv'
import compression from "compression";

const __dirname = dirname(fileURLToPath(import.meta.url))

config({path: `${__dirname}/.env`})

const args = process.argv.slice(2);
const dev = args.some(v => v === "dev");
const test = args.some(v => v === 'test');
const port = Number(args.find(v => v.match(/^port=/))?.substring(5)) || (dev ? 8082 : test ? 8083 : 8080);
const hostname = (dev || test) ? 'localhost' : process.env.NEXT_PUBLIC_HOSTNAME
const project = process.env.NEXT_PUBLIC_PROJECT
const app = next({ ...(dev ? {dev} : {}), hostname, port, dir: __dirname });

const shouldCompress = (req: Request, res: Response) => {
  // don't compress responses asking explicitly not
  if (req.headers['x-no-compression']) {
    return false
  }

  // use compression filter function
  return compression.filter(req, res)
}

const handler = app.getRequestHandler();

const exp = express()
exp.use(compression({filter: shouldCompress}))
exp.get('/api/stream', (req, res) => {
  res.write('hello')
  res.write('world')
  res.end()
})
exp.all('*', (req, res) => {
  handler(req, res).catch(err => {
    console.error('Request handling error:', {
      message: err.message,
      code: err.code,
      stack: JSON.stringify(err.stack),
      requireStack: JSON.stringify(err.requireStack)
    })
  })
})

app.prepare().then(() => {

  const name = (dev || test) ? project : hostname
  spdy.createServer(  {
    key: fs.readFileSync(`${__dirname}/certs/privkey.pem`),
    cert: fs.readFileSync(`${__dirname}/certs/fullchain.pem`),
    ca: fs.readFileSync(`${__dirname}/certs/chain.pem`)
  }, exp).listen(port, () => {
    console.log(`Listening on HTTPS port ${port}`);
  })

});