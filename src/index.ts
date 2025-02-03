import { quiz } from "./Quizes/Quizes";

const dgram = require("node:dgram");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dnsp = require("dns-packet");
const server = dgram.createSocket("udp4");

const API = process.env.GEMINI_API;
const genAI = new GoogleGenerativeAI(API);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const sessions: Record<
  string,
  { questionIndex: number; correct: number; total: number }
> = {};

server.on("error", (err: any) => {
  console.error(`Server error:\n${err.stack}`);
  server.close();
});

server.on("message", async (msg: Buffer, rinfo: any) => {
  try {
    const query = dnsp.decode(msg);

    if (!query.questions || query.questions.length === 0) {
      console.warn("Received a query with no questions.");
      return;
    }

    const prompt = query.questions[0]?.name || "";
    const newPrompt = prompt.split("_").join(" ").toLowerCase();
    console.log(`Received: ${newPrompt}`);

    const sessionKey = `${rinfo.address}:${rinfo.port}`;
    
    if (newPrompt === "start quiz") {

      if (!sessions[sessionKey]) {
        sessions[sessionKey] = {
          questionIndex: 0,
          correct: 0,
          total: Object.keys(quiz).length,
        };
      }

      const session = sessions[sessionKey];
      const currentQuestionKey = Object.keys(quiz)[session.questionIndex];
      const currentQuestion = quiz[currentQuestionKey];

      if (currentQuestion) {
        sendDNSResponse(rinfo, query, [
          `Q${session.questionIndex + 1}: ${currentQuestion.question}`,
          `A) ${currentQuestion.options[0]}`,
          `B) ${currentQuestion.options[1]}`,
          `C) ${currentQuestion.options[2]}`,
          `D) ${currentQuestion.options[3]}`,
          "Reply with A, B, C, or D.",
        ]);
      } else {
        sendDNSResponse(rinfo, query, [
          `Quiz completed! You got ${session.correct} out of ${session.total} correct.`,
        ]);
        delete sessions[sessionKey];
      }
    } else if (sessions[sessionKey]) {

      const session = sessions[sessionKey];
      const currentQuestionKey = Object.keys(quiz)[session.questionIndex];
      const currentQuestion = quiz[currentQuestionKey];

      if (["a", "b", "c", "d"].includes(newPrompt)) {
        if (newPrompt.toUpperCase() === currentQuestion.answer) {
          session.correct += 1;
          sendDNSResponse(rinfo, query, ["Correct! 🎉"]);
        } else {
          sendDNSResponse(rinfo, query, [
            `Wrong! 😢 The correct answer was ${currentQuestion.answer}) ${currentQuestion.options[currentQuestion.answer.charCodeAt(0) - 65]}`,
          ]);
        }

        session.questionIndex += 1;

        if (session.questionIndex < session.total) {
          const nextQuestionKey = Object.keys(quiz)[session.questionIndex];
          const nextQuestion = quiz[nextQuestionKey];

          sendDNSResponse(rinfo, query, [
            `Q${session.questionIndex + 1}: ${nextQuestion.question}`,
            `A) ${nextQuestion.options[0]}`,
            `B) ${nextQuestion.options[1]}`,
            `C) ${nextQuestion.options[2]}`,
            `D) ${nextQuestion.options[3]}`,
            "Reply with A, B, C, or D.",
          ]);
        } else {
          sendDNSResponse(rinfo, query, [
            `Quiz completed! You got ${session.correct} out of ${session.total} correct.`,
          ]);
          delete sessions[sessionKey];
        }
      } else {
        sendDNSResponse(rinfo, query, ["Invalid input! Reply with A, B, C, or D."]);
      }
    } else if (newPrompt === "chat bot") {

      const resultRes = await model.generateText({
        prompt: `You are an expert chatbot. Answer this in max 20 words: ${newPrompt}`,
      });

      const result =
        resultRes.candidates?.[0]?.output ||
        "I'm not sure how to respond to that.";

      sendDNSResponse(rinfo, query, [result]);
    } else {
      sendDNSResponse(rinfo, query, ["Unknown command. Use 'start quiz' or 'chat bot'."]);
    }
  } catch (error) {
    console.error("Error processing DNS query:", error);
  }
});

server.on("listening", () => {
  const address = server.address();
  console.log(`DNS server listening on ${address.address}:${address.port}`);
});

server.on("close", () => {
  console.log("DNS server closed");
});

server.bind(9090);

function sendDNSResponse(rinfo: any, query: any, messages: string[]) {
  const txtResponse = {
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
        data: messages,
      },
    ],
  };

  const responseBuffer = dnsp.encode(txtResponse);
  server.send(responseBuffer, rinfo.port, rinfo.address, (err: any) => {
    if (err) {
      console.error("Failed to send response:", err);
    } else {
      console.log(`Response sent to ${rinfo.address}:${rinfo.port}`);
    }
  });
}
