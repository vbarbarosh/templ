<?php

namespace App\Http\Controllers;

use App\Models\Article;
use Illuminate\Http\Request;

// model    Article
// class    ArticlesController
// var      article_uid
// singular article
// plural   articles

class ArticlesController extends Controller
{
    public function about()
    {
        return [
            'GET /api/v1/articles/about.json',
            'GET /api/v1/articles.json',
            'GET /api/v1/articles/{article_uid}',
            'POST /api/v1/articles',
            'PATCH /api/v1/articles/{article_uid}',
            'DELETE /api/v1/articles/{article_uid}',
        ];
    }

    /**
     * GET /api/v1/articles.json
     */
    public function list(Request $request)
    {
        $q = filters($request, user()->articles());
        return pager($q, Article::frontend_list($q));
    }

    /**
     * GET /api/v1/articles/{article_uid}
     */
    public function fetch($article_uid)
    {
        /** @var Article $article */
        $article = user()->articles()->where('articles.uid', $article_uid)->firstOrFail();
        return Article::frontend_fetch(Article::query()->where('id', $article->id))->first();
    }

    /**
     * POST /api/v1/articles
     */
    public function create(Request $request)
    {
        $article = new Article();
        $article->user_id = user()->id;
        $article->fill_unsafe($request);
        Article::store([$article]);
        return Article::frontend_fetch(Article::query()->where('uid', $article->uid))->firstOrFail();
    }

    /**
     * PATCH /api/v1/articles/{article_uid}
     */
    public function update($article_uid, Request $request)
    {
        /** @var Article $article */
        $article = user()->articles()->where('articles.uid', $article_uid)->firstOrFail();
        $article->fill_unsafe($request);
        Article::store([$article]);
    }

    /**
     * DELETE /api/v1/articles/{article_uid}
     */
    public function remove($article_uid)
    {
        /** @var Article $article */
        $article = user()->articles()->where('articles.uid', $article_uid)->firstOrFail();
        Article::remove(Article::query()->where('id', $article->id));
    }
}
