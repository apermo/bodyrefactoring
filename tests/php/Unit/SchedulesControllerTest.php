<?php
/**
 * SchedulesController Unit Tests
 *
 * @package BodyRefactoring\Tests\Unit
 */

namespace BodyRefactoring\Tests\Unit;

use BodyRefactoring\Api\V1\ApiResponseException;
use BodyRefactoring\Api\V1\SchedulesController;
use PHPUnit\Framework\TestCase;

/**
 * Tests for SchedulesController.
 */
class SchedulesControllerTest extends TestCase {

	/**
	 * Create controller in test mode.
	 *
	 * @return SchedulesController
	 */
	private function create_controller(): SchedulesController {
		$controller = new SchedulesController();
		$controller->enable_test_mode();
		return $controller;
	}

	/**
	 * Test that unknown action returns 404.
	 */
	public function test_handle_unknown_action_returns_404(): void {
		$controller = $this->create_controller();

		$this->expectException( ApiResponseException::class );

		try {
			ob_start();
			$controller->handle( 'unknown', [] );
		} catch ( ApiResponseException $e ) {
			ob_end_clean();
			$this->assertEquals( 404, $e->status_code );
			$this->assertStringContainsString( 'Action not found', $e->body );
			throw $e;
		}
	}

	/**
	 * Test that missing date parameter returns 400.
	 */
	public function test_day_action_missing_date_returns_400(): void {
		$controller = $this->create_controller();

		$this->expectException( ApiResponseException::class );

		try {
			ob_start();
			$controller->handle( 'day', [] );
		} catch ( ApiResponseException $e ) {
			ob_end_clean();
			$this->assertEquals( 400, $e->status_code );
			$this->assertStringContainsString( 'Missing date parameter', $e->body );
			throw $e;
		}
	}

	/**
	 * Test that invalid date format returns 400.
	 */
	public function test_day_action_invalid_date_format_returns_400(): void {
		$controller = $this->create_controller();

		$this->expectException( ApiResponseException::class );

		try {
			ob_start();
			$controller->handle( 'day', [ 'date' => 'not-a-date' ] );
		} catch ( ApiResponseException $e ) {
			ob_end_clean();
			$this->assertEquals( 400, $e->status_code );
			$this->assertStringContainsString( 'Invalid date format', $e->body );
			throw $e;
		}
	}

	/**
	 * Test that invalid date like Feb 30 returns 400.
	 */
	public function test_day_action_invalid_date_returns_400(): void {
		$controller = $this->create_controller();

		$this->expectException( ApiResponseException::class );

		try {
			ob_start();
			$controller->handle( 'day', [ 'date' => '2026-02-30' ] );
		} catch ( ApiResponseException $e ) {
			ob_end_clean();
			$this->assertEquals( 400, $e->status_code );
			$this->assertStringContainsString( 'Invalid date format', $e->body );
			throw $e;
		}
	}
}
