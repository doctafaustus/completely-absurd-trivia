## How to run
This app is NOT using the Vite live server so that we can serve files directly from the Express server. To run, use `npm run watch` in the client directory which instructs Vite to build and watch. 

Live reload is handled by the global `livereload` package, watching the `client/dist` directory. The live reload is a little slow when using `nodemon` so you can use `node app.js` instead if only working on the client side.

To run app:
```bash
// In root directory
nodemon app
```
```bash
// In client directory
npm run watch
```
```bash
// In another terminal
livereload client/dist --debug
```

The app should run on `http://localhost:8080`. Note that we are not serving the `index.html` file using the static directory since we want to run server code before sending the file.


## Multi-page setup
Unfortunately, Vite requires a specific structure to include multiple HTML entry points. You can see how this is configued in `vite.config.js`. Note that all pages require a folder of the page name with the actual HTML file to be named `index.html`. So to reach the Lobby page for example, visit `http://localhost:808/lobby/`. 

## Notes
The Vite build process complains about external scripts not having the `type="module"` attribute. Trying to find a way to disable this warning.


### TODO:
  - Add home page
  - Add option to change username (must be all lowercase since Cloudstore sucks)