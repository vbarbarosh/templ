import db from 'db';
import tsc from 'helpers/tsc';
import tsu from 'helpers/tsu';
import csv from 'neat-csv';
import fs from 'fs';

main().catch(panic).finally(db.end);

function posts_json(rows)
{
    return rows.map(function (row) {
        const tmp = {...row};
        delete tmp.id;
        delete tmp.user_id;
        return tmp;
    });
}

function tags_json(rows)
{
    return rows.map(function (row) {
        const tmp = {...row};
        delete tmp.id;
        return tmp;
    });
}

async function main()
{
    const users = await csv(fs.createReadStream('users.csv'));
    const posts = await csv(fs.createReadStream('posts.csv'));
    const tags = await csv(fs.createReadStream('tags.csv'));

    // Replace tags of post
    if (1) {
        await knex_tags_replace(db, 'posts_tags', {post_id: 2}, ['tag1', 'tag2', 'tag3']);
    }

    // Load posts with tags
    if (1) {
        const posts = await db('posts').where('id', '<', 3);
        const posts_tags = await db('posts_tags').whereIn('post_id', posts.map(v => v.id));
        const tags = await db('tags').whereIn('id', posts_tags.map(v => v.tag_id));
        const posts_map = rows_index(posts, 'id');
        const tags_map = rows_index(tags, 'id');
        console.log({
            posts: posts_json(posts),
            tags: tags_json(tags),
            posts_tags: posts_tags.map(v => ({post_uid: posts_map[v.post_id].uid, tag_uid: tags_map[v.tag_id].uid}))
        });
    }

    // Insert users
    if (0) {
        await db('users').insert(users.map(v => Object.assign({uid: db.uid_users()}, v, tsc())));
        await db('posts').insert(posts.map(v => Object.assign({uid: db.uid_posts()}, v, tsc())));
        await db('tags').insert(tags.map(v => Object.assign({uid: db.uid_tags()}, v, tsc())));
        for (let i = 1; i <= posts.length; ++i) {
            await db('posts_tags').insert({post_id: i, tag_id: Math.ceil(Math.random()*tags.length)});
        }
    }

    // Query users
    if (0) {
        const rows = await db('users').where('email', 'LIKE', '%gov');
        console.log(rows);
    }

    // Update user
    if (0) {
        const input = {uid: 'xxx', name: 'User1'};
        const user = await db('users').where('uid', input.uid).first();
        if (!user) {
            throw new Error(`User Not Found: ${input.uid}`);
        }
        user.name = input.name;
        await db('users').where('uid', input.uid).update({...user, ...tsu()});
        console.log(await db('users').where('uid', user.uid).first());
    }
}

function panic(error)
{
    console.error(error);
    process.exit(1);
}

function tags_add(rows)
{
}

function tags_remove(rows)
{
}

function tags_replace()
{
}

async function knex_tags_replace(db, pivot, where, tags)
{
    await knex_insert_ignore(db, 'tags', tags.map(v => ({uid: db.uid_tags(), title: v, ...tsc()})));
    const ids = await db('tags').whereIn('title', tags).pluck('id');
    await db(pivot).where(where).whereNotIn('tag_id', ids).delete();
    await knex_insert_ignore(db, pivot, ids.map(v => ({...where, tag_id: v})));
}

// insert into `metric_names` (`a`, `b`, `c`, `d`) values (1, 2, DEFAULT, DEFAULT), (DEFAULT, DEFAULT, 3, 4)
// INSERT IGNORE `metric_names` (`a`, `b`, `c`, `d`) values (1, 2, DEFAULT, DEFAULT), (DEFAULT, DEFAULT, 3, 4)
function knex_insert_ignore(knex, table, rows)
{
    if (rows.length == 0) {
        return Promise.resolve();
    }

    const keys = rows_keys(rows);
    const inserts = [];
    const bindings = [table, ...keys];
    for (let i = 0, end = rows.length; i < end; ++i) {
        const row = rows[i];
        const insert = [];
        for (let j = 0, jj = keys.length; j < jj; ++j) {
            const key = keys[j];
            if (row[key] === undefined) {
                insert.push('DEFAULT');
            }
            else {
                insert.push('?');
                bindings.push(row[key]);
            }
        }
        inserts.push(`(${insert})`);
    }
    return knex.raw(`INSERT IGNORE INTO ?? (${keys.slice().fill('??')}) VALUES ${inserts}`, bindings);
}

/**
 * Return all keys mentioned in rows
 *
 * @param rows
 * @returns {string[]}
 */
function rows_keys(rows)
{
    const unique = {};
    for (let i = 0, end = rows.length; i < end; ++i) {
        const keys = Object.keys(rows[i]);
        for (let j = 0, jj = keys.length; j < jj; ++j) {
            unique[keys[j]] = true;
        }
    }
    return Object.keys(unique);
}

function rows_index(rows, fn)
{
    if (typeof fn == 'string') {
        const key = fn;
        fn = row => row[key];
    }

    const map = {};
    rows.forEach(row => map[fn(row)] = row);
    return map;
}
