import notesRouter from "./routes/notes.ts";

const server = Deno.listen({port: 3000});

while (true) {
  try {
    const conn = await server.accept();
    (async () => {
      const httpConn = Deno.serveHttp(conn);
      while (true) {
        try {
          const requestEvent = await httpConn.nextRequest();
          requestEvent?.respondWith(new Response("test", {status: 200}));
        } catch (err) {
          // the connection has finished
          break;
        }
      }
    })();
  } catch (err) {
    // The listener has closed
    break;
  }
}
