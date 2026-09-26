import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {Game} from './game.mjs';
const codes=(process.env.REWARD_CODES||'345231,820935,147983').split(',');
if(codes.length!==3||codes.some(x=>!/^\d{6}$/.test(x)))throw Error('REWARD_CODES must contain three six-digit codes');
const game=new Game({codes});const streams=new Map();
const files=new Map(await Promise.all(['index.html','style.css','app.js','favicon.svg'].map(async f=>['/'+(f==='index.html'?'':f),await readFile(new URL('./public/'+f,import.meta.url))])));
const types={'/':'text/html','/style.css':'text/css','/app.js':'text/javascript','/favicon.svg':'image/svg+xml'};
function broadcast(){for(const [id,res] of streams)res.write('data: '+JSON.stringify(game.view(id))+'\n\n');}
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');
 res.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self'; frame-ancestors 'none'");
 if(req.method==='GET'&&url.pathname==='/health'){res.writeHead(200);return res.end('ok');}
 if(req.method==='GET'&&url.pathname==='/events'){
   if(streams.size>=500){res.writeHead(503);return res.end();}
   const id=randomUUID();res.writeHead(200,{'Content-Type':'text/event-stream','Connection':'keep-alive','X-Accel-Buffering':'no'});res.write('event: identity\ndata: '+JSON.stringify({id})+'\n\n');streams.set(id,res);game.add(id);broadcast();
   res.on('close',()=>{streams.delete(id);game.remove(id);broadcast();});return;
 }
 if(req.method==='POST'&&url.pathname==='/press'){
   if(req.headers['sec-fetch-site']==='cross-site'){res.writeHead(403);return res.end();}
   let body='';try{for await(const chunk of req){body+=chunk;if(body.length>1024){res.writeHead(413);res.end();return;}}const data=JSON.parse(body);if(!streams.has(data.id)){res.writeHead(401);return res.end();}game.press(data.id,data.round);broadcast();res.writeHead(204);res.end();}catch{res.writeHead(400);res.end();}return;
 }
 if(req.method==='GET'&&files.has(url.pathname)){res.writeHead(200,{'Content-Type':types[url.pathname]+'; charset=utf-8'});return res.end(files.get(url.pathname));}
 res.writeHead(404);res.end('Not found');
});
setInterval(()=>{game.tick();broadcast();},100);
server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('ORBIT ready on port '+(process.env.PORT||3000)));
