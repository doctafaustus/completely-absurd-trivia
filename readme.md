## How to run
To run app:
```bash
  // In root directory
  nodemon app
```
```bash
  // In client directory
  npm run dev
```
The app should run on `http://localhost:3000/`

## Notes
Unfortunately, Vite requires a specific structure to include multiple HTML entry points. You can see how this is configued in `vite.config.js`. Note that all pages require a folder of the page name with the actual HTML file to be named `index.html`. 

So to reach the Lobby page for example, visit `http://localhost:3000/lobby/`. <b>Note that the trailing slash (for the "index" file) is required</b>, however in prod this won't matter since we'll be hitting this page via our server in `app.js`. To preview this, visit `http://localhost:8080/lobby` after running `npm run build`.


### TODO:
  - Add home page
  - Add option to change username (must be all lowercase since Cloudstore sucks)