<?php

declare(strict_types=1);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

const AUTH_PASSWORD_HASH = '$2y$12$A4z3kbAihth9tCJHZqgbIuUo4ge3BYhqifTN7yCd.jtq97MQZRP.u';
const AUTH_COOKIE_NAME = 'yurmuvi_auth';
const AUTH_COOKIE_TTL = 2592000; // 30 days

function auth_cookie_value(): string
{
    return hash_hmac('sha256', 'remember_login', AUTH_PASSWORD_HASH);
}

function auth_cookie_secure(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
}

function auth_set_cookie(bool $remember): void
{
    $base = [
        'path' => '/',
        'secure' => auth_cookie_secure(),
        'httponly' => true,
        'samesite' => 'Lax',
    ];

    if ($remember) {
        setcookie(AUTH_COOKIE_NAME, auth_cookie_value(), $base + [
            'expires' => time() + AUTH_COOKIE_TTL,
        ]);
        return;
    }

    setcookie(AUTH_COOKIE_NAME, '', $base + [
        'expires' => time() - 3600,
    ]);
}

function auth_redirect_target(?string $target): string
{
    if (!is_string($target) || $target === '') {
        return '/';
    }

    if ($target[0] !== '/' || str_starts_with($target, '//')) {
        return '/';
    }

    return $target;
}

function auth_is_api_request(): bool
{
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    return str_starts_with($uri, '/api/');
}

function is_authenticated(): bool
{
    if (!empty($_SESSION['authenticated']) && $_SESSION['authenticated'] === true) {
        return true;
    }

    $cookie = $_COOKIE[AUTH_COOKIE_NAME] ?? '';
    if (is_string($cookie) && $cookie !== '' && hash_equals(auth_cookie_value(), $cookie)) {
        $_SESSION['authenticated'] = true;
        return true;
    }

    return false;
}

function require_auth(): void
{
    if (is_authenticated()) {
        return;
    }

    if (auth_is_api_request()) {
        http_response_code(401);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(['error' => 'No autenticado']);
        exit;
    }

    $requested = $_SERVER['REQUEST_URI'] ?? '/';
    $redirect = rawurlencode(auth_redirect_target($requested));
    header('Location: /login.php?redirect=' . $redirect);
    exit;
}

function attempt_login(string $password, bool $remember): bool
{
    if (!password_verify($password, AUTH_PASSWORD_HASH)) {
        return false;
    }

    session_regenerate_id(true);
    $_SESSION['authenticated'] = true;
    auth_set_cookie($remember);
    return true;
}

function logout_user(): void
{
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }

    session_destroy();
    auth_set_cookie(false);
}
