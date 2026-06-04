<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DownloadLog extends Model
{
    protected $fillable = [
        'user_id',
        'source',
        'request_url',
        'media_type',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
