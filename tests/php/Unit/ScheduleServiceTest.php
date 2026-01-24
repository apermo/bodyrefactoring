<?php
/**
 * ScheduleService Unit Tests
 *
 * @package BodyRefactoring\Tests\Unit
 */

namespace BodyRefactoring\Tests\Unit;

use BodyRefactoring\Tests\Mocks\MockDatabase;
use PHPUnit\Framework\TestCase;
use ScheduleService;

/**
 * Tests for ScheduleService.
 */
class ScheduleServiceTest extends TestCase {

	/**
	 * Mock database.
	 *
	 * @var MockDatabase
	 */
	private MockDatabase $db;

	/**
	 * Service under test.
	 *
	 * @var ScheduleService
	 */
	private ScheduleService $service;

	/**
	 * Set up test fixtures.
	 */
	protected function setUp(): void {
		$this->db      = new MockDatabase();
		$this->service = new ScheduleService( $this->db );
	}

	/**
	 * Test that invalid date format returns null.
	 */
	public function test_get_schedule_for_date_invalid_format_returns_null(): void {
		$result = $this->service->get_schedule_for_date( 'invalid-date' );
		$this->assertNull( $result );
	}

	/**
	 * Test that invalid date like 2026-02-30 returns null.
	 */
	public function test_get_schedule_for_date_invalid_date_returns_null(): void {
		$result = $this->service->get_schedule_for_date( '2026-02-30' );
		$this->assertNull( $result );
	}

	/**
	 * Test that skip override returns null.
	 */
	public function test_get_schedule_for_date_skip_override_returns_null(): void {
		$this->db->set_query_one_response( 'date_overrides', [
			'override_type' => 'skip',
			'target_date'   => '2026-01-24',
		] );

		$result = $this->service->get_schedule_for_date( '2026-01-24' );
		$this->assertNull( $result );
	}

	/**
	 * Test that replace override returns override config.
	 */
	public function test_get_schedule_for_date_replace_override_returns_override(): void {
		$day_config = [
			'id'      => 'special',
			'name'    => 'Special Day',
			'theme'   => 'Rest',
			'details' => [],
		];

		$this->db->set_query_one_response( 'date_overrides', [
			'override_type' => 'replace',
			'target_date'   => '2026-01-24',
			'day_config'    => json_encode( $day_config ),
			'note'          => 'Holiday',
		] );

		$result = $this->service->get_schedule_for_date( '2026-01-24' );

		$this->assertNotNull( $result );
		$this->assertEquals( '2026-01-24', $result['date'] );
		$this->assertEquals( 'special', $result['id'] );
		$this->assertEquals( 'Special Day', $result['name'] );
		$this->assertTrue( $result['hasOverride'] );
		$this->assertEquals( 'Holiday', $result['overrideNote'] );
	}

	/**
	 * Test that no template returns null.
	 */
	public function test_get_schedule_for_date_no_template_returns_null(): void {
		// No override.
		$this->db->set_query_one_response( 'date_overrides', null );
		// No template.
		$this->db->set_query_one_response( 'schedule_templates', null );

		$result = $this->service->get_schedule_for_date( '2026-01-24' );
		$this->assertNull( $result );
	}

	/**
	 * Test successful schedule retrieval from template.
	 */
	public function test_get_schedule_for_date_returns_template_day(): void {
		// No override.
		$this->db->set_query_one_response( 'date_overrides', null );

		// Active template.
		$this->db->set_query_one_response( 'schedule_templates', [
			'id'         => 1,
			'name'       => 'Test Schedule',
			'start_date' => '2026-01-01',
			'end_date'   => null,
			'is_active'  => 1,
		] );

		// Day config (Saturday = 6 for 2026-01-24).
		$this->db->set_query_one_response( 'schedule_days', [
			'id'          => 10,
			'template_id' => 1,
			'day_index'   => 6,
			'day_id'      => 'sat',
			'name'        => 'SAMSTAG',
			'theme'       => 'Full Body',
			'icon'        => 'dumbbell',
			'color_class' => 'text-blue-400',
			'bg_class'    => 'bg-blue-500/10',
		] );

		// Exercises.
		$this->db->set_query_response( 'schedule_exercises', [
			[
				'exercise_id'  => 'warmup1',
				'type'         => 'warmup',
				'title'        => 'Warm Up',
				'description'  => '5 minutes',
				'weight'       => null,
				'default_unit' => null,
				'timers'       => null,
				'rep_counter'  => null,
				'custom_label' => null,
				'date_condition' => null,
				'date_description' => null,
			],
		] );

		$result = $this->service->get_schedule_for_date( '2026-01-24' );

		$this->assertNotNull( $result );
		$this->assertEquals( '2026-01-24', $result['date'] );
		$this->assertEquals( 6, $result['dayIndex'] );
		$this->assertEquals( 'sat', $result['id'] );
		$this->assertEquals( 'SAMSTAG', $result['name'] );
		$this->assertEquals( 'Full Body', $result['theme'] );
		$this->assertFalse( $result['hasOverride'] );
		$this->assertEquals( 'Test Schedule', $result['templateName'] );
		$this->assertCount( 1, $result['details'] );
		$this->assertEquals( 'warmup1', $result['details'][0]['id'] );
	}

	/**
	 * Test add override merges exercises.
	 */
	public function test_get_schedule_for_date_add_override_merges_exercises(): void {
		// Add override.
		$this->db->set_query_one_response( 'date_overrides', [
			'override_type' => 'add',
			'target_date'   => '2026-01-24',
			'exercises'     => json_encode( [
				[ 'id' => 'extra1', 'type' => 'main', 'title' => 'Extra Exercise' ],
			] ),
			'note'          => 'Bonus workout',
		] );

		// Template.
		$this->db->set_query_one_response( 'schedule_templates', [
			'id'         => 1,
			'name'       => 'Test Schedule',
			'start_date' => '2026-01-01',
		] );

		// Day config.
		$this->db->set_query_one_response( 'schedule_days', [
			'id'          => 10,
			'template_id' => 1,
			'day_index'   => 6,
			'day_id'      => 'sat',
			'name'        => 'SAMSTAG',
			'theme'       => 'Full Body',
			'icon'        => null,
			'color_class' => null,
			'bg_class'    => null,
		] );

		// Base exercises.
		$this->db->set_query_response( 'schedule_exercises', [
			[
				'exercise_id'  => 'base1',
				'type'         => 'main',
				'title'        => 'Base Exercise',
				'description'  => null,
				'weight'       => null,
				'default_unit' => null,
				'timers'       => null,
				'rep_counter'  => null,
				'custom_label' => null,
				'date_condition' => null,
				'date_description' => null,
			],
		] );

		$result = $this->service->get_schedule_for_date( '2026-01-24' );

		$this->assertNotNull( $result );
		$this->assertTrue( $result['hasOverride'] );
		$this->assertEquals( 'Bonus workout', $result['overrideNote'] );
		$this->assertCount( 2, $result['details'] );
		$this->assertEquals( 'base1', $result['details'][0]['id'] );
		$this->assertEquals( 'extra1', $result['details'][1]['id'] );
	}

	/**
	 * Test day index calculation for different dates.
	 */
	public function test_day_index_calculation(): void {
		// Set up minimal mocks.
		$this->db->set_query_one_response( 'date_overrides', null );
		$this->db->set_query_one_response( 'schedule_templates', [
			'id'         => 1,
			'name'       => 'Test',
			'start_date' => '2026-01-01',
		] );
		$this->db->set_query_response( 'schedule_exercises', [] );

		// 2026-01-24 is Saturday (6).
		$this->db->set_query_one_response( 'schedule_days', [
			'id' => 1, 'template_id' => 1, 'day_index' => 6, 'day_id' => 'sat',
			'name' => 'SAT', 'theme' => null, 'icon' => null, 'color_class' => null, 'bg_class' => null,
		] );
		$result = $this->service->get_schedule_for_date( '2026-01-24' );
		$this->assertEquals( 6, $result['dayIndex'] );

		// 2026-01-25 is Sunday (0).
		$this->db->set_query_one_response( 'schedule_days', [
			'id' => 1, 'template_id' => 1, 'day_index' => 0, 'day_id' => 'sun',
			'name' => 'SUN', 'theme' => null, 'icon' => null, 'color_class' => null, 'bg_class' => null,
		] );
		$result = $this->service->get_schedule_for_date( '2026-01-25' );
		$this->assertEquals( 0, $result['dayIndex'] );

		// 2026-01-26 is Monday (1).
		$this->db->set_query_one_response( 'schedule_days', [
			'id' => 1, 'template_id' => 1, 'day_index' => 1, 'day_id' => 'mon',
			'name' => 'MON', 'theme' => null, 'icon' => null, 'color_class' => null, 'bg_class' => null,
		] );
		$result = $this->service->get_schedule_for_date( '2026-01-26' );
		$this->assertEquals( 1, $result['dayIndex'] );
	}
}
