# minimalist-db
A minimal database server written with express
## Features
### Super fast
minimalist-db only does everything it absolutely needs to do. It provides an API to modify a database, and nothing more. This makes it blazing fast.
### Easy to use
To set up minimalist-db, all you need to do is

1. Clone the repository
2. Put a password into `data.json`
3. Run `./db-start [port]` (or just `./db-start` to use port 3000)

To store a value to a running database, all you need to do is

1. POST `/login` with the password - a token will be returned if you use the correct password
2. POST `/[tableName]` with any data you would like to set
3. Check `data.json`. It should now have the data in it.
### Nested objects
Because minimalist-db is built on JSON, you can store infinitely recursive objects in a database.
## Using
### IMPORTANT: Security Risks
If you do not use ssl, tokens will be passed between client and server in plain text. This will be mitigated in a later release, but for now, use SSL if possible.
### API Pathways
All POST pathways return JSON.
All GET pathways return either JSON or HTML (specify with `accept` header).
All pathways except for `/login` and `/logout` require a token in the authorization header.

`/login`: POST
* Takes a password
* Returns a usable token, if successful, or an error message

`/logout`: POST
* Takes a token
* Removes the token from use, so it can be recycled

`/[table]`: GET/POST
* GET
  * Returns the requested table, if the correct token was supplied
  * Table needs to exist
* POST
  * Takes a JSON object to set the table to
  * Sets the table to this JSON object
  * Table does not need to exist

`/[table]/[key]`: POST
* Table needs to exist
* Takes a JSON object to set the key to
* Sets the specified key in the table to this JSON object

`/`: GET
* Returns an index of the entire database
