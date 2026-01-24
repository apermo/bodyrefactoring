<?php
/**
 * Logout Handler
 *
 * Clears authentication cookie and redirects to index.
 *
 * @package BodyRefactoring
 */

// Clear auth cookie and redirect to home page.
require_once __DIR__ . '/tools.php';

clear_auth_cookie();
header( 'Location: index.php' );
exit;
