import { InMemorySessionAdapter } from "https://raw.githubusercontent.com/nikolinmajmari/xapi/main/xapi/session/adapter.ts";
import {SessionProvider, FileAdapter} from "./deps.ts";

const appSession = new SessionProvider({
  adapter: new FileAdapter().configure({sessionPath:"./var/session"}),
  lifetime: 1020202,
  secret: "secret",
});

export default appSession;
