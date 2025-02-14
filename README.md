# DNS-serve

## DNS-serve is a command line tool for various tasks like AI chat bot, quiz system and many more

### Commands 
```
Commands :- dig +short TXT @localhost -p 9090 Your_query_here_in_this_format
```

### To Initialize
```
Commands :- dig +short TXT @localhost -p 9090 start_quiz
Commands :- dig +short TXT @localhost -p 9090 chat_bot
```

### Running environment

``` bun ```

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run dev
```

This is the project that will help the Gemini model to run in your terminal with help of a custom build DNS server with help of DIG command and with a port number directed to 9090. Also there is a quiz app in built with that along with AI model that will ask you questoins and will score you according to the answers you give.

This project was created using `bun init` in bun v1.1.36. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
