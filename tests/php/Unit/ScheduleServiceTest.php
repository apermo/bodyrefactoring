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

	/**
	 * Test should_show_exercise_for_date with no dateCondition.
	 */
	public function test_should_show_exercise_no_condition(): void {
		$exercise = [ 'id' => 'test', 'title' => 'Test' ];
		$this->assertTrue( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-24' ) );
	}

	/**
	 * Test 'once' dateCondition - matches exact date.
	 */
	public function test_should_show_exercise_once_condition(): void {
		$exercise = [
			'id'            => 'test',
			'dateCondition' => [ 'once' => '2026-01-24' ],
		];

		$this->assertTrue( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-24' ) );
		$this->assertFalse( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-25' ) );
	}

	/**
	 * Test 'weekOfMonth' dateCondition.
	 */
	public function test_should_show_exercise_week_of_month_condition(): void {
		$exercise = [
			'id'            => 'test',
			'dateCondition' => [ 'weekOfMonth' => [ 1, 3 ] ],
		];

		// 2026-01-03 is in week 1 (days 1-7).
		$this->assertTrue( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-03' ) );
		// 2026-01-15 is in week 3 (days 15-21).
		$this->assertTrue( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-15' ) );
		// 2026-01-10 is in week 2 (days 8-14).
		$this->assertFalse( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-10' ) );
	}

	/**
	 * Test 'weekParity' dateCondition - odd weeks.
	 */
	public function test_should_show_exercise_week_parity_odd(): void {
		$exercise = [
			'id'            => 'test',
			'dateCondition' => [ 'weekParity' => 'odd' ],
		];

		// 2026-01-05 is in ISO week 2 (even).
		$this->assertFalse( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-05' ) );
		// 2026-01-12 is in ISO week 3 (odd).
		$this->assertTrue( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-12' ) );
	}

	/**
	 * Test 'weekParity' dateCondition - even weeks.
	 */
	public function test_should_show_exercise_week_parity_even(): void {
		$exercise = [
			'id'            => 'test',
			'dateCondition' => [ 'weekParity' => 'even' ],
		];

		// 2026-01-05 is in ISO week 2 (even).
		$this->assertTrue( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-05' ) );
		// 2026-01-12 is in ISO week 3 (odd).
		$this->assertFalse( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-12' ) );
	}

	/**
	 * Test 'dayOfMonth' dateCondition - positive day.
	 */
	public function test_should_show_exercise_day_of_month_positive(): void {
		$exercise = [
			'id'            => 'test',
			'dateCondition' => [ 'dayOfMonth' => 15 ],
		];

		$this->assertTrue( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-15' ) );
		$this->assertTrue( ScheduleService::should_show_exercise_for_date( $exercise, '2026-02-15' ) );
		$this->assertFalse( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-14' ) );
	}

	/**
	 * Test 'dayOfMonth' dateCondition - negative day (from end of month).
	 */
	public function test_should_show_exercise_day_of_month_negative(): void {
		// -1 = last day of month.
		$exercise = [
			'id'            => 'test',
			'dateCondition' => [ 'dayOfMonth' => -1 ],
		];

		// January has 31 days.
		$this->assertTrue( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-31' ) );
		// February 2026 has 28 days.
		$this->assertTrue( ScheduleService::should_show_exercise_for_date( $exercise, '2026-02-28' ) );
		$this->assertFalse( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-30' ) );

		// -2 = second to last day.
		$exercise['dateCondition']['dayOfMonth'] = -2;
		$this->assertTrue( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-30' ) );
		$this->assertTrue( ScheduleService::should_show_exercise_for_date( $exercise, '2026-02-27' ) );
	}

	/**
	 * Test 'nthWeekday' dateCondition - first Monday.
	 */
	public function test_should_show_exercise_nth_weekday_first(): void {
		$exercise = [
			'id'            => 'test',
			'dateCondition' => [
				'nthWeekday' => [
					'nth'     => 1,
					'weekday' => 1, // Monday
				],
			],
		];

		// 2026-01-05 is the first Monday of January.
		$this->assertTrue( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-05' ) );
		// 2026-01-12 is the second Monday.
		$this->assertFalse( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-12' ) );
		// 2026-02-02 is the first Monday of February.
		$this->assertTrue( ScheduleService::should_show_exercise_for_date( $exercise, '2026-02-02' ) );
	}

	/**
	 * Test 'nthWeekday' dateCondition - last Friday.
	 */
	public function test_should_show_exercise_nth_weekday_last(): void {
		$exercise = [
			'id'            => 'test',
			'dateCondition' => [
				'nthWeekday' => [
					'nth'     => -1,
					'weekday' => 5, // Friday
				],
			],
		];

		// 2026-01-30 is the last Friday of January.
		$this->assertTrue( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-30' ) );
		// 2026-01-23 is the 4th Friday (not last).
		$this->assertFalse( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-23' ) );
		// 2026-02-27 is the last Friday of February.
		$this->assertTrue( ScheduleService::should_show_exercise_for_date( $exercise, '2026-02-27' ) );
	}

	/**
	 * Test 'months' dateCondition - only show in specific months.
	 */
	public function test_should_show_exercise_months_filter(): void {
		$exercise = [
			'id'            => 'test',
			'dateCondition' => [ 'months' => [ 1, 4, 7, 10 ] ], // Quarterly.
		];

		// January - included.
		$this->assertTrue( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-15' ) );
		// April - included.
		$this->assertTrue( ScheduleService::should_show_exercise_for_date( $exercise, '2026-04-15' ) );
		// February - not included.
		$this->assertFalse( ScheduleService::should_show_exercise_for_date( $exercise, '2026-02-15' ) );
	}

	/**
	 * Test 'months' combined with 'dayOfMonth' for quarterly patterns.
	 */
	public function test_should_show_exercise_months_with_day_of_month(): void {
		// First day of Q1, Q2, Q3, Q4.
		$exercise = [
			'id'            => 'test',
			'dateCondition' => [
				'months'     => [ 1, 4, 7, 10 ],
				'dayOfMonth' => 1,
			],
		];

		$this->assertTrue( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-01' ) );
		$this->assertTrue( ScheduleService::should_show_exercise_for_date( $exercise, '2026-04-01' ) );
		$this->assertFalse( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-15' ) );
		$this->assertFalse( ScheduleService::should_show_exercise_for_date( $exercise, '2026-02-01' ) );
	}

	/**
	 * Test 'months' combined with 'nthWeekday' for quarterly patterns.
	 */
	public function test_should_show_exercise_months_with_nth_weekday(): void {
		// First Monday of Jan, Apr, Jul, Oct.
		$exercise = [
			'id'            => 'test',
			'dateCondition' => [
				'months'     => [ 1, 4, 7, 10 ],
				'nthWeekday' => [
					'nth'     => 1,
					'weekday' => 1, // Monday
				],
			],
		];

		// 2026-01-05 is first Monday of January.
		$this->assertTrue( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-05' ) );
		// 2026-04-06 is first Monday of April.
		$this->assertTrue( ScheduleService::should_show_exercise_for_date( $exercise, '2026-04-06' ) );
		// 2026-02-02 is first Monday of February (not in months list).
		$this->assertFalse( ScheduleService::should_show_exercise_for_date( $exercise, '2026-02-02' ) );
		// 2026-01-12 is second Monday of January (wrong week).
		$this->assertFalse( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-12' ) );
	}

	/**
	 * Test 'weekInterval' dateCondition - every 3 weeks.
	 */
	public function test_should_show_exercise_week_interval(): void {
		$exercise = [
			'id'            => 'test',
			'dateCondition' => [
				'weekInterval' => [
					'every' => 3,
					'from'  => '2026-01-05', // Reference Monday.
				],
			],
		];

		// Week 0 (reference week).
		$this->assertTrue( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-05' ) );
		// Week 3 (3 weeks later).
		$this->assertTrue( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-26' ) );
		// Week 6 (6 weeks later).
		$this->assertTrue( ScheduleService::should_show_exercise_for_date( $exercise, '2026-02-16' ) );
		// Week 1 (not on interval).
		$this->assertFalse( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-12' ) );
		// Week 2 (not on interval).
		$this->assertFalse( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-19' ) );
	}

	/**
	 * Test 'weekInterval' dateCondition - before reference date returns false.
	 */
	public function test_should_show_exercise_week_interval_before_reference(): void {
		$exercise = [
			'id'            => 'test',
			'dateCondition' => [
				'weekInterval' => [
					'every' => 2,
					'from'  => '2026-01-15',
				],
			],
		];

		// Date before reference should not match.
		$this->assertFalse( ScheduleService::should_show_exercise_for_date( $exercise, '2026-01-10' ) );
	}
}
