import { startUdpServer, createConsoleLog } from "denamed";

// Start the UDP server on port 9999
startUdpServer((query: any): any => {
  // Check if questions exists and is an array
  if (query?.questions && Array.isArray(query.questions) && query.questions.length > 0) {
    console.log(query.questions[0]?.name);  // Log the name if available
  } else {
    console.error("No valid questions array found in the query.");
  }
  return;
}, { port: 9999, log: createConsoleLog() });

console.log("DNS server running on port 9999...");
