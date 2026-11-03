#!/usr/bin/env node
import {readFile} from 'node:fs/promises';
import {publishFeed,recordFeedFailure} from '../server/feed-store.mjs';
async function main(){
 const args=process.argv.slice(2);let result;
 if(args[0]==='--failure')result=await recordFeedFailure();
 else if(args.length===1){let input;if(args[0]==='-'){const chunks=[];let size=0;for await(const chunk of process.stdin){chunks.push(chunk);size+=chunk.length;if(size>4*1024*1024)throw new Error();}input=Buffer.concat(chunks).toString('utf8');}else input=await readFile(args[0],'utf8');if(input.length>4*1024*1024)throw new Error();result=await publishFeed(JSON.parse(input));}
 else throw new Error();
 process.stdout.write(JSON.stringify({status:result.sync.status,updatedAt:result.updatedAt,counts:result.sync.counts})+'\n');
}
main().catch(()=>{process.stderr.write('Feed publish failed: invalid input or unavailable storage. Previous content retained.\n');process.exitCode=1;});
