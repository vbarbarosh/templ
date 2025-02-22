<?php

namespace App\Models;

use App\Helpers\Traits\Upsert;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

/**
 * @property $id
 * @property $uid
 * @property $user_id
 * @property $title
 * @property $body
 * @property Carbon $created_at
 * @property Carbon $updated_at
 *
 * @property User $user
 */
class Article extends Model
{
    use Upsert;

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'id',
        'user_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
    ];

    /**
     * @param $query
     * @return Collection
     */
    static public function frontend_list($query)
    {
        $relations = ['user'];
        return $query->with($relations)->get()->map(function (Article $article) {
            return [
                'uid' => $article->uid,
                'user' => [
                    'uid' => $article->user->uid,
                    'email' => $article->user->email,
                ],
                'title' => $article->title,
                'created_at' => $article->created_at->toAtomString(),
                'updated_at' => $article->updated_at->toAtomString(),
            ];
        });
    }

    /**
     * @param $query
     * @return Collection
     */
    static public function frontend_fetch($query)
    {
        $relations = ['user'];
        return $query->with($relations)->get()->map(function (Article $article) {
            return [
                'uid' => $article->uid,
                'user' => [
                    'uid' => $article->user->uid,
                    'email' => $article->user->email,
                ],
                'title' => $article->title,
                'body' => $article->body,
                'created_at' => $article->created_at->toAtomString(),
                'updated_at' => $article->updated_at->toAtomString(),
            ];
        });
    }

    public function store($items)
    {
        Article::upsert($items);
    }

    public function remove($query)
    {
        safety_check_query_for_batch_remove($query);

        return $query->pluck('articles.id')->chunk(100)->sum(function ($ids) {
            return Article::query()->whereIn('id', $ids)->delete();
        });
    }

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->uid = uid_article();
    }

    public function replicate(array $except = null)
    {
        $out = parent::replicate($except);
        $out->uid = uid_article();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function fill_unsafe($input)
    {
        $this->title = trim($input['title'] ?? '') ?: 'New Article';
        $this->body = trim($input['body'] ?? '') ?: null;
    }
}
