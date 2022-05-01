# Simple Notes App using xapi framework

The app is a note app that uses simple session authentication. Users and notes are saved in file system. Below we show some images of the app and how it was builded. 

### Below we show the link to images form the app examples ui 

- [Login Page](./doc/login.png)
- [Sign up Page](./doc/signup.png)
- [Notes Page](./doc/notes.png)
- [New Note Page](./doc/notes_new.png)
- [Edit Note Page](./doc/notes_edit.png)

### The packages used on the app are 

- [xapi-app]()
- [xapi-session]()
- [xapi-auth]()

The upper packages also use dependencies from other packages. Check the other packages for more details. 

### The app folder structure 

- `` Assets   `` In this folder static assets are served like css html and javascript files 
- `` Auth         ``In this folder authentication of the app is configured, we used xapi-auth session authenticatior for this 
- `` Database     ``  The database is configured here. Some simple classes are builded to encapsulate working with files so we would work only with objects to store and retrive data. Also db data is stored here
- `` Doc          `` app documentation is here 
- `` models       `` App models. Our simple app has two model calses a User and a Note class
- `` private_uploads     `` The directory for private uplaoded files. These files must not be accesed as static accessed files 
- `` routes       `` The routes of the app where the buisness logic is put
- `` var          `` A directory used for tempory data of the app. Sessions are stored here
- `` views        `` The views of the app. We used Eta engine. We did not import it here as it is already imported from xapi-app package
- `` app.ts       `` The entry point of the app, 
- `` db.ts        `` The file that instantiates the db. We separated it on a single file so we could use it on other files also
- `` deps.ts      `` App dependencies of other packages
- `` session.ts   `` In this file session manager is instanciated 
- `` run.bat      `` Run the app on windows 

### Some nice features on this app 

#### Session initialization 
```ts
import {SessionProvider, FileAdapter} from "./deps.ts";

const appSession = new SessionProvider({
  adapter: new FileAdapter().configure({sessionPath:"./var/session"}),
  lifetime: 1020202
});

export default appSession;

```
lifetime and secret yet does not work but we will work on it. Then session could be used accos the app as below

#### Inject the session middleware in app.ts
```ts
...
import appSession from "./session.ts";
...

const app = new Application();
...
app.use(appSession.inject());
...

```
#### Use session across middleware handlers as below 

```ts
/// obtain session of request using appsession 
const session = appSession.of(ctx);
  if(session!=undefined){
    /// retrive data from session
    const counter:string = await session.get("counter")??"0";
    console.log(counter);
    const newCounter = parseInt(counter)+1;
    if(newCounter>100){
      /// clear data from session 
      await session.clear("counter");
    }else{
      /// save update data into session 
      await session.set("counter",newCounter.toString());
    }
    /// flush session into file
    await session.flush();
    await ctx.res.sent(newCounter.toString());
  }
```

#### Use static middleware to serve static files 

```ts
app.use(
  staticMiddleware({
    path: "/assets",
    urlMapper: (e) => e.replace("/assets", ""),
  })
);
```
The path is the folder path where static files will be served
The url mapper removes /assets path from the url to serve static files directly as localhost:8000/css/.. etc

#### Session Authentication Manager did not have much to be configured 

```ts
import { SessionAuth } from "../deps.ts";
import { User } from "../models/user.ts";
const manager =  new SessionAuth<User>();
/// todo add configuration here 
export default manager;
```
As we see Session authenticator is a generic class therefore it needs an model calass that will use to authenticate. 

#### Add auth middleware in app.ts
The auth middleware needs to be added after session. This middleware will authenticate the user using session cokie. 
```ts
...
import appSession from "./session.ts";
import authManager from "./auth/config.ts";
...
const app = new Application();
...
app.use(appSession.inject());
app.use(authManager.authMiddleware());
...
```
Session authenticator uses session to store security token. When user remakes the request security token stored in session is retrived and user is authenticated. 
Note that this authenticator is yet simple. 

Then in the login route we init authentication as below.

#### User authentication 
- First we create an auth router and add routes on it 
```ts
mport {Router} from "../deps.ts";
import { User } from "../models/user.ts";
import db from "../db.ts";
import authManager from "../auth/config.ts";

const router = new Router();

/// this route serves the login page
/// .render method of ContextResponse is similar to eta renderFile method. We just wraped it with render method and set by default content type and response body of response for you. But renderFile method can also be used directly 
router.get("/login", async (ctx, next) => {
  return await ctx.res.render("./login.html");
});

...

export default router;
```
The form data submited is of type UrlFormEncoded Below we show the post route that authenticates the user
#### User Login Post

```ts

router.post("/login", [
  async (ctx, next) => {
    
    /// parse request body as application-form-url-encoded
    const form =  await ctx.req.body.parseForm();
    const username = form.get("username");
    const password = form.get("password");
    /// load from db an instance of user class of interest 
    const user = (await db.load<User>(User,(u)=>u.username==username && u.password == password)).findLast(()=>true);
    /// if user does not exists then redirect to login 
    if(user==undefined){
      return await ctx.res.redirect("/auth/login");
    }
    /// otherwise authenticate the user 
    await authManager.eject(ctx)?.authenticate(user,[]);
    /// redirect to /notes page of interest
    await ctx.res.redirect("/notes");
  },
]);


```

Somehow similar is also the sign up. Just in that case we do not call `load<T>(type:typeof Model<T>):Promise<T[]>` method of the database but we call `createModel<T>(type:typeof Model<T>,model:T):Promise<void>` method. 

We also implemented file upload when we were crearing a new note. Below we show the notes new post route where we upload our file. We used two api for file upload. One provided by deno and another by xapi-api which encapsulated some of Deno operation. Below we show both examples. 
body parameter of requet uses code ported directly from oka framework. Check the files for more information. 
```ts
router.post("/new", async (ctx, next) => {
  try {
    /// when submiting files body must be parsed 
    /// as multipart form data. ()
    const form = await ctx.req.body.parseMultipartFormData();
    /// ontain title and content fields 
    const {title, content}: {[key: string]: string} = {...form.fields};
    /// files are on another property 
    const _files = form.files ?? [];
    let file = "";
    for (const _file of _files) {
        /// we are interested only for file submited by form under name file
      if (_file.name == "file") {
          /// calculate the new path of file, this will be saved in db as name
        file = "user_1_" + Date.now().toString() + "_" + _file.originalName;
        /// open new file with create on the respective folder
        const fp = await Deno.open("./private_uploads/notes/" + file, {
          write: true,
          create: true,
        });
        /// write from content if file is not writet on disk
        if (_file.content != undefined) {
          await fp.writable.getWriter().write(_file.content);
        } else {
            /// write from disk if file is writet into disk 
          const source = await Deno.open(_file.filename!, {read: true});
          await source.readable.pipeTo(fp.writable);
        }
        break;
      }
    }
    /// create new note and save into database
    const note = new Note();
    note.title = title;
    note.content = content;
    note.file = file;
    await db.createModel(Note, note);
    /// redirect to index
    await ctx.res.redirect("/notes");
  } catch (e) {
    // return a bad request 
    await ctx.res.statusBadRequest().sent();
  }
});
```

### The other method uses XapiFormDataFiles wrapper as below
```ts
router.post("/new_other", async (ctx, next) => {
  try {
    const note = new Note();
    const form = await ctx.req.body.parseMultipartFormData();
    const {title, content}: {[key: string]: string} = {...form.fields};
    /// wrap the files with wrapper
    const _files = new XapiFormDataFiles(form.files!);
    /// obtain the file of interest 
    const file = _files.get("file");
    if (file != null) {
      /// set file path to save in db 
      const filePath =
        "./private_uploads/notes/user_1_" +
        Date.now().toString() +
        "_" +
        file.originalName;
        /// save the file
      await file.save("./private_uploads/notes/"+filePath);
      /// update the property 
      note.file = filePath;
    }
    note.title = title;
    note.content = content;
    await db.createModel(Note, note);
    await ctx.res.redirect("/notes");
  } catch (e) {
    await ctx.res.statusBadRequest().sent();
  }
});
```

### Edit and delete
For edit and delete and update we added an aditional middleware that would load the note and share it through the context with the other middleware handlers later. Below we show the example 

```ts
router.use("/:id(\\d+)", async (ctx, next) => {
  const {id} = ctx.req.params;
  const note = (await db.load<Note>(Note, (e) => e.id == id)).findLast(
    (e) => true
  );
  if (note == undefined) {
    return await ctx.res.notFound();
  }
  ctx.attribs.note = note;
  await next();
});

router.get("/:id(\\d+)", async (ctx, next) => {
  const note = ctx.attribs.note;
  /// the upper middleware is allways called when 
  /// url matches "/:id(\\d+)"
  /// therefore we are sure that ctx.attribs.note allways
  /// contains note if other middlewares are callled 
  await ctx.res.render("./notes/edit.html.eta", {
    title: note.title,
    content: note.content,
    file: note.file,
  });
});

/**
 * update specific note
 */
router.post("/:id(\\d+)", async (ctx, next) => {
    const note:Note = ctx.attribs.note;
    /// update code here , check the file for more info
    ctx.res.redirect("/notes/"+ctx.req.params.id);
});

/**
 * delete specific note
 */
router.delete("/:id(\\d+)", async (ctx, next) => {
  const note:Note = ctx.attribs.note;
  /// delete code here
  next()
});


```

#### Another important part was that we needed to ensure that when user accesses these routes he must be authenticated and he/she can not access login and signup if he/she is authenticated

- For the part of ensuring the user is authenticated add in app 
before all middlewares that must be authenticated code below 

```ts
...
app.use(authManager.ensureAuthenticated());
...
/// or add it before respective routers 
/// if we add middleware before auth that user would not be 
/// able to authenticate therefore you must be carefull when adding middlewares, the order is very important
app.use("/auth", authRouter);
app.use("/notes",[authManager.ensureAuthenticated(), notesRouter]);
...
```
- For the case of login and signup routes the code below fixes the issue 


```ts
/// /routes.auth.ts
router.use(["/login","/signup"],async (ctx,next)=>{
  if(authManager.eject(ctx)?.isAuthenticated()){
    return await ctx.res.redirect("/notes");
  }
  await next();
});
```
This code redirect users to /notes path if they are authenticated. 

### Thanks for reading 