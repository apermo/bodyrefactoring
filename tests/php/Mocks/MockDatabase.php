<?php
/**
 * Mock Database for Testing
 *
 * Simulates database responses for unit tests.
 *
 * @package BodyRefactoring\Tests\Mocks
 */

namespace BodyRefactoring\Tests\Mocks;

/**
 * Mock database that returns predefined responses.
 */
class MockDatabase implements \DatabaseInterface {

	/**
	 * Query responses keyed by SQL pattern.
	 *
	 * @var array
	 */
	private array $query_responses = [];

	/**
	 * Query one responses keyed by SQL pattern.
	 *
	 * @var array
	 */
	private array $query_one_responses = [];

	/**
	 * Executed queries for verification.
	 *
	 * @var array
	 */
	private array $executed_queries = [];

	/**
	 * Set response for query().
	 *
	 * @param string $pattern SQL pattern to match.
	 * @param array  $response Response to return.
	 */
	public function set_query_response( string $pattern, array $response ): void {
		$this->query_responses[ $pattern ] = $response;
	}

	/**
	 * Set response for query_one().
	 *
	 * @param string     $pattern  SQL pattern to match.
	 * @param array|null $response Response to return.
	 */
	public function set_query_one_response( string $pattern, ?array $response ): void {
		$this->query_one_responses[ $pattern ] = $response;
	}

	/**
	 * Execute a query and return all results.
	 *
	 * @param string $sql    SQL query.
	 * @param array  $params Parameters.
	 * @return array
	 */
	public function query( string $sql, array $params = [] ): array {
		$this->executed_queries[] = [ 'sql' => $sql, 'params' => $params ];

		foreach ( $this->query_responses as $pattern => $response ) {
			if ( str_contains( $sql, $pattern ) ) {
				return $response;
			}
		}

		return [];
	}

	/**
	 * Execute a query and return first result.
	 *
	 * @param string $sql    SQL query.
	 * @param array  $params Parameters.
	 * @return array|null
	 */
	public function query_one( string $sql, array $params = [] ): ?array {
		$this->executed_queries[] = [ 'sql' => $sql, 'params' => $params ];

		foreach ( $this->query_one_responses as $pattern => $response ) {
			if ( str_contains( $sql, $pattern ) ) {
				return $response;
			}
		}

		return null;
	}

	/**
	 * Execute a statement.
	 *
	 * @param string $sql    SQL statement.
	 * @param array  $params Parameters.
	 * @return int
	 */
	public function execute( string $sql, array $params = [] ): int {
		$this->executed_queries[] = [ 'sql' => $sql, 'params' => $params ];
		return 1;
	}

	/**
	 * Get last insert ID.
	 *
	 * @return string
	 */
	public function last_insert_id(): string {
		return '1';
	}

	/**
	 * Check if tables exist.
	 *
	 * @return bool
	 */
	public function tables_exist(): bool {
		return true;
	}

	/**
	 * Get all executed queries.
	 *
	 * @return array
	 */
	public function get_executed_queries(): array {
		return $this->executed_queries;
	}

	/**
	 * Reset mock state.
	 */
	public function reset(): void {
		$this->query_responses     = [];
		$this->query_one_responses = [];
		$this->executed_queries    = [];
	}
}
