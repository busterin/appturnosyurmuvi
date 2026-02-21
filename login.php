<?php

declare(strict_types=1);

require __DIR__ . '/auth.php';

if (isset($_GET['logout'])) {
    logout_user();
}

$redirect = auth_redirect_target($_GET['redirect'] ?? '/');
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = (string)($_POST['password'] ?? '');
    $remember = isset($_POST['remember']);
    $redirect = auth_redirect_target($_POST['redirect'] ?? '/');

    if (attempt_login($password, $remember)) {
        header('Location: ' . $redirect);
        exit;
    }

    $error = 'Contrasena incorrecta';
}

if (is_authenticated()) {
    header('Location: ' . $redirect);
    exit;
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acceso - Gestion de Turnos</title>
    <link rel="icon" type="image/png" href="/images/favicomyurmuvi.png">
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            min-height: 100vh;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #d75a4a;
            padding: 10px;
        }
        .login-wrap {
            max-width: 1200px;
            margin: 0 auto;
            width: 100%;
        }
        .logo-wrap {
            text-align: center;
            margin-bottom: 20px;
        }
        .logo-image {
            width: 160px;
            margin: 0 auto 10px;
            display: block;
        }
        .login-card {
            width: 100%;
            max-width: 420px;
            background: #fff;
            border-radius: 12px;
            padding: 24px;
            margin: 0 auto;
        }
        h1 {
            margin: 0 0 16px;
            font-size: 22px;
            text-align: center;
        }
        label {
            display: block;
            font-weight: 700;
            margin-bottom: 6px;
        }
        input[type="password"] {
            width: 100%;
            border: 1px solid #ccc;
            border-radius: 6px;
            padding: 11px;
            font-size: 16px;
        }
        .remember {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 14px;
            margin-bottom: 14px;
            font-weight: 600;
        }
        .remember label {
            margin: 0;
            font-weight: 600;
        }
        button {
            width: 100%;
            border: none;
            background: #000;
            color: #fff;
            border-radius: 6px;
            padding: 12px;
            font-weight: 700;
            font-size: 15px;
            cursor: pointer;
        }
        .error {
            background: #ffe3e3;
            color: #931c1c;
            border: 1px solid #f2b0b0;
            border-radius: 6px;
            padding: 10px;
            margin-bottom: 12px;
            font-size: 14px;
        }
        @media (min-width: 600px) {
            body { padding: 20px; }
            .logo-image { width: 200px; }
        }
    </style>
</head>
<body>
    <div class="login-wrap">
        <div class="logo-wrap">
            <img src="/images/logoyurmuvi.PNG" class="logo-image" alt="Logo">
        </div>

        <form class="login-card" method="post" action="/login.php">
            <h1>Acceso</h1>

            <?php if ($error !== ''): ?>
                <div class="error"><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></div>
            <?php endif; ?>

            <input type="hidden" name="redirect" value="<?php echo htmlspecialchars($redirect, ENT_QUOTES, 'UTF-8'); ?>">

            <label for="password">Contrasena</label>
            <input id="password" name="password" type="password" required autocomplete="current-password">

            <div class="remember">
                <input id="remember" type="checkbox" name="remember" value="1">
                <label for="remember">Recordar contrasena</label>
            </div>

            <button type="submit">Entrar</button>
        </form>
    </div>
</body>
</html>
