<?php
/**
 * Base API Controller
 *
 * @package BodyRefactoring\Api\V1
 */

namespace BodyRefactoring\Api\V1;

/**
 * Exception thrown when API response is sent (for testing).
 */
class ApiResponseException extends \Exception {

	/**
	 * HTTP status code.
	 *
	 * @var int
	 */
	public int $status_code;

	/**
	 * Response body.
	 *
	 * @var string
	 */
	public string $body;

	/**
	 * Constructor.
	 *
	 * @param int    $status_code HTTP status code.
	 * @param string $body        Response body.
	 */
	public function __construct( int $status_code, string $body ) {
		parent::__construct( $body, $status_code );
		$this->status_code = $status_code;
		$this->body        = $body;
	}
}

/**
 * Abstract base controller for API endpoints.
 */
abstract class Controller {

	/**
	 * Whether to throw exceptions instead of exit (for testing).
	 *
	 * @var bool
	 */
	protected bool $test_mode = false;

	/**
	 * Enable test mode (throws exceptions instead of exit).
	 */
	public function enable_test_mode(): void {
		$this->test_mode = true;
	}

	/**
	 * Send a JSON error response and exit.
	 *
	 * @param int    $code    HTTP status code.
	 * @param string $message Error message.
	 * @param array  $extra   Additional data to include.
	 * @throws ApiResponseException In test mode.
	 */
	protected function error( int $code, string $message, array $extra = [] ): void {
		http_response_code( $code );
		$body = json_encode( array_merge( [ 'error' => $message ], $extra ) );
		echo $body;

		if ( $this->test_mode ) {
			throw new ApiResponseException( $code, $body );
		}
		exit;
	}

	/**
	 * Send a JSON success response and exit.
	 *
	 * @param mixed $data Response data.
	 * @param int   $code HTTP status code.
	 * @throws ApiResponseException In test mode.
	 */
	protected function response( mixed $data, int $code = 200 ): void {
		http_response_code( $code );
		$body = json_encode( $data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE );
		echo $body;

		if ( $this->test_mode ) {
			throw new ApiResponseException( $code, $body );
		}
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
