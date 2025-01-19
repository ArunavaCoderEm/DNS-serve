const dgram = require('node:dgram');
const server = dgram.createSocket('udp4');

server.on('error', (err:any) => {
  console.error(`server error:\n${err.stack}`);
  server.close();
});

server.on('message', (msg: any) => {
  console.log(`server got: ${msg}`);
});

server.bind(9090, () => {
  console.log("DNS server running on port 9090");
})