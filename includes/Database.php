<?php
/**
 * Database Connection Helper
 *
 * Provides PDO connection singleton for MySQL database access.
 *
 * @package BodyRefactoring
 */

/**
 * Database connection singleton.
 *
 * Usage:
 *   $db = Database::get_instance();
 *   $stmt = $db->prepare('SELECT * FROM schedule_templates WHERE id = ?');
 */
class Database {

	/**
	 * Singleton instance.
	 *
	 * @var Database|null
	 */
	private static ?Database $instance = null;

	/**
	 * PDO connection.
	 *
	 * @var PDO
	 */
	private PDO $pdo;

	/**
	 * Private constructor (singleton pattern).
	 *
	 * @throws PDOException If connection fails.
	 */
	private function __construct() {
		$host     = getenv( 'DB_HOST' ) ?: 'db';
		$name     = getenv( 'DB_NAME' ) ?: 'db';
		$user     = getenv( 'DB_USER' ) ?: 'db';
		$password = getenv( 'DB_PASS' ) ?: 'db';
		$port     = getenv( 'DB_PORT' ) ?: '3306';
		$charset  = 'utf8mb4';

		$dsn = "mysql:host={$host};port={$port};dbname={$name};charset={$charset}";

		$options = [
			PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
			PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
			PDO::ATTR_EMULATE_PREPARES   => false,
		];

		$this->pdo = new PDO( $dsn, $user, $password, $options );
	}

	/**
	 * Get the singleton instance.
	 *
	 * @return Database
	 */
	public static function get_instance(): Database {
		if ( self::$instance === null ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Get the PDO connection.
	 *
	 * @return PDO
	 */
	public function get_connection(): PDO {
		return $this->pdo;
	}

	/**
	 * Prepare a statement.
	 *
	 * @param string $sql SQL query with placeholders.
	 * @return PDOStatement
	 */
	public function prepare( string $sql ): PDOStatement {
		return $this->pdo->prepare( $sql );
	}

	/**
	 * Execute a query and return all results.
	 *
	 * @param string $sql    SQL query with placeholders.
	 * @param array  $params Parameters to bind.
	 * @return array
	 */
	public function query( string $sql, array $params = [] ): array {
		$stmt = $this->pdo->prepare( $sql );
		$stmt->execute( $params );
		return $stmt->fetchAll();
	}

	/**
	 * Execute a query and return first result.
	 *
	 * @param string $sql    SQL query with placeholders.
	 * @param array  $params Parameters to bind.
	 * @return array|null
	 */
	public function query_one( string $sql, array $params = [] ): ?array {
		$stmt = $this->pdo->prepare( $sql );
		$stmt->execute( $params );
		$result = $stmt->fetch();
		return $result !== false ? $result : null;
	}

	/**
	 * Execute a statement (INSERT, UPDATE, DELETE).
	 *
	 * @param string $sql    SQL statement with placeholders.
	 * @param array  $params Parameters to bind.
	 * @return int Number of affected rows.
	 */
	public function execute( string $sql, array $params = [] ): int {
		$stmt = $this->pdo->prepare( $sql );
		$stmt->execute( $params );
		return $stmt->rowCount();
	}

	/**
	 * Get the last inserted ID.
	 *
	 * @return string
	 */
	public function last_insert_id(): string {
		return $this->pdo->lastInsertId();
	}

	/**
	 * Begin a transaction.
	 *
	 * @return bool
	 */
	public function begin_transaction(): bool {
		return $this->pdo->beginTransaction();
	}

	/**
	 * Commit a transaction.
	 *
	 * @return bool
	 */
	public function commit(): bool {
		return $this->pdo->commit();
	}

	/**
	 * Rollback a transaction.
	 *
	 * @return bool
	 */
	public function rollback(): bool {
		return $this->pdo->rollBack();
	}

	/**
	 * Check if database tables exist.
	 *
	 * @return bool True if schedule_templates table exists.
	 */
	public function tables_exist(): bool {
		try {
			$result = $this->query_one(
				"SELECT COUNT(*) as cnt FROM information_schema.tables
				 WHERE table_schema = DATABASE() AND table_name = 'schedule_templates'"
			);
			return ( $result['cnt'] ?? 0 ) > 0;
		} catch ( PDOException $e ) {
			return false;
		}
	}

	/**
	 * Initialize the database schema.
	 *
	 * @return bool True on success.
	 * @throws PDOException If schema execution fails.
	 */
	public function init_schema(): bool {
		$schema_file = __DIR__ . '/database/schema.sql';

		if ( ! file_exists( $schema_file ) ) {
			throw new RuntimeException( 'Schema file not found: ' . $schema_file );
		}

		$sql = file_get_contents( $schema_file );

		// Split by semicolon and execute each statement
		$statements = array_filter(
			array_map( 'trim', explode( ';', $sql ) ),
			fn( $s ) => ! empty( $s ) && strpos( $s, '--' ) !== 0
		);

		foreach ( $statements as $statement ) {
			// Skip pure comment blocks
			if ( preg_match( '/^--/', $statement ) ) {
				continue;
			}
			$this->pdo->exec( $statement );
		}

		return true;
	}

	/**
	 * Prevent cloning.
	 */
	private function __clone() {}

	/**
	 * Prevent unserialization.
	 *
	 * @throws RuntimeException Always.
	 */
	public function __wakeup(): void {
		throw new RuntimeException( 'Cannot unserialize singleton' );
	}
}
