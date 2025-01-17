import { startUdpServer, createConsoleLog } from "denamed";

startUdpServer((query: any): any => {
  try {
    if (query?.type === 'OPT') {
      console.log("Unsupported OPT type query received");
      return; 
    }
    
    console.log("Received query:", query);
    
    if (query?.questions?.[0]?.type === 'TXT') {
      return {
        type: 'response',
        questions: query.questions,
        answers: [
          {
            name: query.questions[0].name,
            type: 'TXT',
            class: 'IN',
            ttl: 300,
            data: 'Example TXT response'
          }
        ]
      };
    }
    
    console.log("Unhandled query type:", query.questions?.[0]?.type);
    return;
  } catch (e) {
    console.error("Error handling query:", e);
  }
}, { port: 9999, log: createConsoleLog() });

console.log('DNS server running on port 9999.');
