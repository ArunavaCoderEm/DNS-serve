const dgram = require("node:dgram");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dnsp = require("dns-packet");
const server = dgram.createSocket("udp4");

const API = process.env.GEMINI_API;

const genAI = new GoogleGenerativeAI(API);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    console.log(newPrompt);
    if (newPrompt === "start quiz") {

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
            data: ["Quiz started! Answer the following questions."],
          },
        ],
      };

      const responseBuffer = dnsp.encode(txtResponse);
      server.send(responseBuffer, rinfo.port, rinfo.address);
    } else if (newPrompt === "chat bot") {
 
      const resultRes = await model.generateText({
        prompt: `You are an expert on everything like a chatbot. Now answer in max 20 words: ${newPrompt}`,
      });

      const result = resultRes.candidates?.[0]?.output || "I'm not sure how to respond to that.";

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
            data: [result],
          },
        ],
      };

      const responseBuffer = dnsp.encode(txtResponse);

      server.send(responseBuffer, rinfo.port, rinfo.address, (err: any) => {
        if (err) {
          console.error("Failed to send response:", err);
        } else {
          console.log(
            "Response sent successfully to",
            rinfo.address,
            ":",
            rinfo.port
          );
        }
      });
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
