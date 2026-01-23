<?php
/**
 * Logout Handler
 *
 * Clears authentication cookie and redirects to index.
 *
 * @package BodyRefactoring
 */

require_once __DIR__ . '/tools.php';

clearAuthCookie();
header( 'Location: index.php' );
exit;
