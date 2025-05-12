db.getSiblingDB('hello').createUser({
    user: 'hello',
    pwd: 'hello',
    roles: [{role: 'readWrite', db: 'hello'}]
});
