<?php
/**
 * Database Interface
 *
 * Contract for database access, allowing mock implementations for testing.
 *
 * @package BodyRefactoring
 */

/**
 * Interface for database operations.
 */
interface DatabaseInterface {

	/**
	 * Execute a query and return all results.
	 *
	 * @param string $sql    SQL query with placeholders.
	 * @param array  $params Parameters to bind.
	 * @return array
	 */
	public function query( string $sql, array $params = [] ): array;

	/**
	 * Execute a query and return first result.
	 *
	 * @param string $sql    SQL query with placeholders.
	 * @param array  $params Parameters to bind.
	 * @return array|null
	 */
	public function query_one( string $sql, array $params = [] ): ?array;

	/**
	 * Execute a statement (INSERT, UPDATE, DELETE).
	 *
	 * @param string $sql    SQL statement with placeholders.
	 * @param array  $params Parameters to bind.
	 * @return int Number of affected rows.
	 */
	public function execute( string $sql, array $params = [] ): int;

	/**
	 * Get the last inserted ID.
	 *
	 * @return string
	 */
	public function last_insert_id(): string;

	/**
	 * Check if database tables exist.
	 *
	 * @return bool
	 */
	public function tables_exist(): bool;
}
