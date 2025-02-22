https://github.com/features/actions

    error-pages
      GET /
        ✓ should respond with page list
      Accept: text/html
        GET /403
          ✓ should respond with 403
        GET /404
          ✓ should respond with 404
        GET /500
          ✓ should respond with 500
      Accept: application/json
        GET /403
          ✓ should respond with 403
        GET /404
          ✓ should respond with 404
        GET /500
          ✓ should respond with 500
      Accept: text/plain
        GET /403
          ✓ should respond with 403
        GET /404
          ✓ should respond with 404
        GET /500
          ✓ should respond with 500
    error
      GET /
        ✓ should respond with 500
      GET /next
        ✓ should respond with 500
      GET /missing
        ✓ should respond with 404

    markdown
      GET /
        ✓ should respond with html
      GET /fail
        ✓ should respond with an error

    multi-router
      GET /
        ✓ should respond with root handler
      GET /api/v1/
        ✓ should respond with APIv1 root handler
      GET /api/v1/users
        ✓ should respond with users from APIv1
      GET /api/v2/
        ✓ should respond with APIv2 root handler
      GET /api/v2/users
        ✓ should respond with users from APIv2

    mvc
      GET /
        ✓ should redirect to /users
      GET /pet/0
        ✓ should get pet
      GET /pet/0/edit
        ✓ should get pet edit page
      PUT /pet/2
        ✓ should update the pet
      GET /users
        ✓ should display a list of users (70ms)
      GET /user/:id
        when present
          ✓ should display the user
          ✓ should display the users pets
        when not present
          ✓ should 404
      GET /user/:id/edit
        ✓ should display the edit form
      PUT /user/:id
        ✓ should 500 on error
        ✓ should update the user
      POST /user/:id/pet
        ✓ should create a pet for user (19ms)

    params
      GET /
        ✓ should respond with instructions
      GET /user/0
        ✓ should respond with a user
      GET /user/9
        ✓ should fail to find user
      GET /users/0-2
        ✓ should respond with three users
      GET /users/foo-bar
        ✓ should fail integer parsing

    resource
      GET /
        ✓ should respond with instructions
      GET /users
        ✓ should respond with all users
      GET /users/1
        ✓ should respond with user 1
      GET /users/9
        ✓ should respond with error
      GET /users/1..3
        ✓ should respond with users 1 through 3
      DELETE /users/1
        ✓ should delete user 1
      DELETE /users/9
        ✓ should fail
      GET /users/1..3.json
        ✓ should respond with users 2 and 3 as json

    route-map
      GET /users
        ✓ should respond with users
      DELETE /users
        ✓ should delete users
      GET /users/:id
        ✓ should get a user
      GET /users/:id/pets
        ✓ should get a users pets
      GET /users/:id/pets/:pid
        ✓ should get a users pet

    route-separation
      GET /
        ✓ should respond with index
      GET /users
        ✓ should list users
      GET /user/:id
        ✓ should get a user
        ✓ should 404 on missing user
      GET /user/:id/view
        ✓ should get a user
        ✓ should 404 on missing user (13ms)
      GET /user/:id/edit
        ✓ should get a user to edit
      PUT /user/:id/edit
        ✓ should edit a user
      POST /user/:id/edit?_method=PUT
        ✓ should edit a user
      GET /posts
        ✓ should get a list of posts

    vhost
      example.com
        GET /
          ✓ should say hello
        GET /foo
          ✓ should say foo
      foo.example.com
        GET /
          ✓ should redirect to /foo
      bar.example.com
        GET /
          ✓ should redirect to /bar

    web-service
      GET /api/users
        without an api key
          ✓ should respond with 400 bad request
        with an invalid api key
          ✓ should respond with 401 unauthorized
        with a valid api key
          ✓ should respond users json
      GET /api/repos
        without an api key
          ✓ should respond with 400 bad request
        with an invalid api key
          ✓ should respond with 401 unauthorized
        with a valid api key
          ✓ should respond repos json

    GET /api/user/:name/repos
      without an api key
        ✓ should respond with 400 bad request
      with an invalid api key
        ✓ should respond with 401 unauthorized
      with a valid api key
        ✓ should respond user repos json
        ✓ should 404 with unknown user

    when requesting an invalid route
      ✓ should respond with 404 json
