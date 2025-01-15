import { startUdpServer, createConsoleLog } from "denamed";

startUdpServer((query: any): any => {
  try {
    if (query?.type === 'OPT') {
      console.log("Unsupported OPT type query received");
      return;
    }
    
    console.log(query?.queryResponse);
    return query;
  } catch (e) {
    console.log(e);
  }
}, { port: 9999, log: createConsoleLog() });

console.log('DNS server running on port 9999...');
