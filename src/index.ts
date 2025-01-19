import { startUdpServer, createConsoleLog } from "denamed";

startUdpServer((query: any): any => {
  try {

    console.log("Received query:", query);

    if (query?.type === 'OPT') {
      console.log("Unsupported OPT type query received");
      return null;
    }

    if (query?.questions?.[0]?.type === 'TXT') {
      const response = {
        id: query.id, 
        queryResponse: 1, 
        operationCode: 0,
        authoritativeAnswer: true,
        truncation: false,
        recursionDesired: query.recursionDesired,
        recursionAvailable: false,
        responseCode: 0,
        questions: query.questions, 
        answers: [
          {
            name: query.questions[0].name,
            type: 'TXT',
            class: 'IN',
            ttl: 300,
            data: ['Example TXT response'] 
          }
        ],
        authorities: [],
        additional: []
      };

      return response;
    }
    
    console.log("Unhandled query type:", query.questions?.[0]?.type);
    return null;
    
  } catch (e) {
    console.error("Error handling query:", e);
    return null;
  }
}, { 
  port: 9090, 
  log: createConsoleLog() 
});

console.log('DNS server running on port 9090.');