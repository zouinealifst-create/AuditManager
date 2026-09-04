<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permissionKey): Response
    {
        if (!$request->user() || !$request->user()->hasPermission($permissionKey)) {
            return response()->json(['message' => 'Permission refusée.'], 403);
        }

        return $next($request);
    }
}
