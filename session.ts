import { InMemorySessionAdapter } from "https://raw.githubusercontent.com/nikolinmajmari/xapi/main/xapi/session/adapter.ts";
import {SessionProvider, FileAdapter} from "./deps.ts";

const appSession = new SessionProvider({
  adapter: new InMemorySessionAdapter(),
  lifetime: 1020202,
  secret: "secret",
});

export default appSession;
