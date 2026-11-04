import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';

// Local preview only; never turns the production app into a reservation API.
const selectedPort=Number(process.env.AINPE_LOCAL_API_PORT||4173);
const localPort=Number.isInteger(selectedPort)&&selectedPort>=1024&&selectedPort<=65535?selectedPort:4173;
const target=`http://127.0.0.1:${localPort}`;
const reservationProxy={target,changeOrigin:true,configure(proxy){
  proxy.on('proxyReq',(upstream,req)=>{
    const remote=req.socket?.remoteAddress;
    const match=/^(?:127\.0\.0\.1|localhost|\[::1\]):(\d+)$/i.exec(String(req.headers.host||''));
    const origin=req.headers.origin;
    // Preserve the reservation API's local/same-origin write boundary across
    // the development proxy. Cross-origin requests keep their original origin.
    if(['127.0.0.1','::1','::ffff:127.0.0.1'].includes(remote)&&match&&Number(match[1])===req.socket.localPort&&origin===`http://${req.headers.host}`){
      upstream.setHeader('Origin',target);
    }
  });
}};
export default defineConfig({ plugins:[uni()],server:{host:'127.0.0.1',proxy:{'/api/reservations':reservationProxy,'/api':{target,changeOrigin:true}}} });
