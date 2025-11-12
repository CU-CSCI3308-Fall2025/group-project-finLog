### TO RUN 

- docker compose up 

- docker compose down -v or docker compose down --volumes  // this wipes all volumes meaning the database is wiped from information, not necessarily bad but you will have to re-register each time you wipe it

- YOU MIGHT WANT TO WIPE the user_images/ directory before restarting, otherwise more than 1 image might be renamed with the same id. Below I mention how images are stored

### Image storing

- images are stored in the user_images/ directory //this directory is in .gitignore so you will have to make it 
- .env.example is configured to how the .env file should be -> the only thing I've set that matters is POSTGRES_DBs name

### worflow 

- The tables.sql file shows the tables and relationships we have but the actual sql file used for postgres is in src/init_data/create.sql 
- if you have permission issues editing this file from the terminal you might have to run a command with 'sudo'

- the upload is handled by upload.js form submission
- in the backend storeImage inserts the required information on the posts table
- storeImage then puts the image in the directory with a temporary name
- after postgres creates a uniqueId for the image, we rename the stored image with the uniqueID.filetype (jpg,jpeg,png)
- the user dashboard uses queries using userid, postid and imageid, to fetch the correct image to display for a post

- All data displayed in the frontend is fetched using api requests that execute SQL queries in our backend to fetch that data for a specific user/post/image/etc. 