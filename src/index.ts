import { startUdpServer, DnsQueryMessage, DnsResponseMessage } from "denamed";

// Define the QueryHandler type
type QueryHandler = (query: DnsQueryMessage) => DnsResponseMessage;

startUdpServer((query): DnsResponseMessage => {
    console.log("Received query:", query);

    // Return a valid DNS response
    return {
        answers: [
            {
              name: "",
              type: "A",  
              data: "",
            }
        ]
    };
}, { port: 8000 });
