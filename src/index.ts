const dgram = require('node:dgram');
const dnsp = require('dns-packet');
const server = dgram.createSocket('udp4');

server.on('error', (err: any) => {
   console.error(`server error:\n${err.stack}`);
   server.close();
});

server.on('message', (msg: any, rinfo: any) => {
   try {
       const query = dnsp.decode(msg);
       console.log('Received query:', query);

       const response = {
           type: 'response', 
           id: query.id,
           flags: dnsp.RECURSION_DESIRED | dnsp.RECURSION_AVAILABLE,
           questions: query.questions,
           answers: [{
               type: 'A',
               class: 'IN',
               name: query.questions[0].name,
               ttl: 300,
               data: 'hey there'
           }],
           authorities: [],
           additionals: []
       };

       console.log('Sending response:', response);

       const responseBuffer = dnsp.encode(response);

       server.send(responseBuffer, rinfo.port, rinfo.address, (err: any) => {
           if (err) {
               console.error('Failed to send response:', err);
           } else {
               console.log('Response sent successfully to', rinfo.address, ':', rinfo.port);
           }
       });
   } catch (error) {
       console.error('Error processing DNS query:', error);
   }
});

server.on('listening', () => {
   const address = server.address();
   console.log(`DNS server listening on ${address.address}:${address.port}`);
});

server.on('close', () => {
   console.log('DNS server closed');
});

process.on('uncaughtException', (err) => {
   console.error('Uncaught Exception:', err);
});

server.bind(9090);