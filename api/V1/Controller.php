<?php
/**
 * Base API Controller
 *
 * @package BodyRefactoring\Api\V1
 */

namespace BodyRefactoring\Api\V1;

/**
 * Abstract base controller for API endpoints.
 */
abstract class Controller {

	/**
	 * Send a JSON error response and exit.
	 *
	 * @param int    $code    HTTP status code.
	 * @param string $message Error message.
	 * @param array  $extra   Additional data to include.
	 */
	protected function error( int $code, string $message, array $extra = [] ): void {
		http_response_code( $code );
		echo json_encode( array_merge( [ 'error' => $message ], $extra ) );
		exit;
	}

	/**
	 * Send a JSON success response and exit.
	 *
	 * @param mixed $data Response data.
	 * @param int   $code HTTP status code.
	 */
	protected function response( mixed $data, int $code = 200 ): void {
		http_response_code( $code );
		echo json_encode( $data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE );
		exit;
	}

	/**
	 * Handle the request.
	 *
	 * @param string $action The action to perform.
	 * @param array  $params Request parameters.
	 */
	abstract public function handle( string $action, array $params ): void;
}
