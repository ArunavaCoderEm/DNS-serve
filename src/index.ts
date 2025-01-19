import { startUdpServer, createConsoleLog } from "denamed";

startUdpServer(
  (query: any): any => {
    try {
      console.log("Received query:", query);

      if (!query?.questions || !Array.isArray(query.questions) || query.questions.length === 0 || !query?.answer.data.target) {
        console.warn("Invalid or missing questions in query:", query);
        return null;
      }

      const question = query.questions[0];

      if (!question?.type || !question?.name) {
        console.warn("Invalid question structure:", question);
        return null;
      }

      if (question.type === "TXT") {
        const response = {
          id: query.id,
          queryResponse: 1,
          operationCode: 0,
          authoritativeAnswer: true,
          truncation: false,
          recursionDesired: query.recursionDesired || false,
          recursionAvailable: false,
          responseCode: 0,
          questions: query.questions,
          answers: [
            {
              name: question.name,
              type: "TXT",
              class: "IN",
              ttl: 300,
              data: ["Example TXT response"],
            },
          ],
          authorities: [],
          additional: [],
        };

        return response;
      } else if (question.type === "CNAME") {
        const cnameResponse = {
          id: query.id,
          queryResponse: 1,
          operationCode: 0,
          authoritativeAnswer: true,
          truncation: false,
          recursionDesired: query.recursionDesired || false,
          recursionAvailable: false,
          responseCode: 0,
          questions: query.questions,
          answers: [
            {
              name: question.name,
              type: "CNAME",
              class: "IN",
              ttl: 300,
              data: {
                target: "google.com", 
              },
            },
          ],
          authorities: [],
          additional: [],
        };

        return cnameResponse;
      }

      console.warn("Unhandled query type:", question.type);
      return null;
    } catch (e) {
      console.error("Error handling query:", e);
      return null;
    }
  },
  {
    port: 9090,
    log: createConsoleLog(),
  }
);

console.log("DNS server running on port 9090.");
