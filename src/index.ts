import * as dgram from "node:dgram";
import * as dnsp from "dns-packet";
import { quiz } from "./Quizes/Quizes";
import { GoogleGenerativeAI } from "@google/generative-ai";

const server = dgram.createSocket("udp4");
const API = process.env.GEMINI_API;
const genAI = new GoogleGenerativeAI(API || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const sessions: Record<
  string,
  { questionIndex: number; correct: number; total: number }
> = {};

server.on("error", (err) => {
  console.error(`Server error:\n${err.stack}`);
  server.close();
});

server.on("message", async (msg, rinfo) => {
  try {
    const query = dnsp.decode(msg) as dnsp.Packet;
    console.log("Received query:", query); 

    if (!query.questions || query.questions.length === 0) return;

    const prompt = query.questions[0]?.name || "";
    const newPrompt = prompt.split("_").join(" ").toLowerCase();
    const sessionKey = `${rinfo.address}:${rinfo.port}`;

    console.log("Received prompt:", newPrompt);


    if (newPrompt === "start quiz") {
      if (!sessions[sessionKey]) {
        console.log("Initializing session for:", sessionKey);
        sessions[sessionKey] = {
          questionIndex: 0,
          correct: 0,
          total: Object.keys(quiz).length,
        };
      }

      const session = sessions[sessionKey];
      const currentQuestionKey = Object.keys(quiz)[session.questionIndex];
      const currentQuestion = quiz[currentQuestionKey];

      const txtResponse: dnsp.Packet = {
        type: "response",
        id: query.id,
        flags: dnsp.RECURSION_DESIRED | dnsp.RECURSION_AVAILABLE,
        questions: query.questions,
        answers: [
          {
            type: "TXT",
            class: "IN",
            name: query.questions[0].name,
            ttl: 300,
            data: [
              `Q${session.questionIndex + 1}: ${currentQuestion.question}`,
              `A) ${currentQuestion.options[0]}`,
              `B) ${currentQuestion.options[1]}`,
              `C) ${currentQuestion.options[2]}`,
              `D) ${currentQuestion.options[3]}`,
              "Reply with A, B, C, or D.",
            ],
          },
        ],
      };

      const responseBuffer = dnsp.encode(txtResponse);
      console.log("Sending question:", currentQuestion.question);  
      server.send(responseBuffer, rinfo.port, rinfo.address);
    } 

    else if (["a", "b", "c", "d"].includes(newPrompt.toLowerCase())) {
      console.log("Received answer:", newPrompt.toLowerCase()); 

      if (!sessions[sessionKey]) {
        console.log("No session found for key:", sessionKey);  
        return;
      }

      const session = sessions[sessionKey];
      const currentQuestionKey = Object.keys(quiz)[session.questionIndex];
      const currentQuestion = quiz[currentQuestionKey];
      const correctAnswer = currentQuestion.answer.toLowerCase();

      if (newPrompt.toLowerCase() === correctAnswer) {
        console.log("Correct answer chosen!");  
        session.correct++;
      } else {
        console.log("Incorrect answer chosen.");  
      }

      session.questionIndex++;

      if (session.questionIndex < session.total) {
        const nextQuestionKey = Object.keys(quiz)[session.questionIndex];
        const nextQuestion = quiz[nextQuestionKey];

        const txtResponse: dnsp.Packet = {
          type: "response",
          id: query.id,
          flags: dnsp.RECURSION_DESIRED | dnsp.RECURSION_AVAILABLE,
          questions: query.questions,
          answers: [
            {
              type: "TXT",
              class: "IN",
              name: query.questions[0].name,
              ttl: 300,
              data: [
                `Q${session.questionIndex + 1}: ${nextQuestion.question}`,
                `A) ${nextQuestion.options[0]}`,
                `B) ${nextQuestion.options[1]}`,
                `C) ${nextQuestion.options[2]}`,
                `D) ${nextQuestion.options[3]}`,
                "Reply with A, B, C, or D.",
              ],
            },
          ],
        };

        const responseBuffer = dnsp.encode(txtResponse);
        console.log("Sending next question:", nextQuestion.question);  
        server.send(responseBuffer, rinfo.port, rinfo.address);
      } else {
        const txtResponse: dnsp.Packet = {
          type: "response",
          id: query.id,
          flags: dnsp.RECURSION_DESIRED | dnsp.RECURSION_AVAILABLE,
          questions: query.questions,
          answers: [
            {
              type: "TXT",
              class: "IN",
              name: query.questions[0].name,
              ttl: 300,
              data: [
                `Quiz completed! You got ${session.correct} out of ${session.total} correct.`,
              ],
            },
          ],
        };
        const responseBuffer = dnsp.encode(txtResponse);
        console.log("Sending final response:", txtResponse);  
        server.send(responseBuffer, rinfo.port, rinfo.address);
        delete sessions[sessionKey];  
        console.log("Session deleted for key:", sessionKey);  
      }
    }
  } catch (error) {
    console.error("Error processing DNS query:", error);
  }
});

server.on("listening", () => {
  const address = server.address();
  console.log(`DNS server listening on ${address.address}:${address.port}`);
});

server.bind(9090);
