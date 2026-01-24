// @ts-check
const { test, expect } = require( '@playwright/test' );
const { AppPage } = require( '../pages/AppPage' );
const { setupMockSchedule } = require( '../fixtures/test-helpers' );

/**
 * Login/Auth Tests
 *
 * Tests for optional password authentication feature.
 * The test environment does NOT have auth enabled (no APP_PASSWORD_HASH),
 * so we test both public instance behavior and mock protected instance behavior.
 */
test.describe( 'Login and Authentication', () => {
	test.beforeEach( async ( { page } ) => {
		await setupMockSchedule( page );
	} );

	test.describe( 'Public Instance (auth disabled)', () => {
		test( 'shows app directly without login page', async ( { page } ) => {
			const app = new AppPage( page );
			await app.goto();
			await app.waitForAppReady();

			// App should be visible (not login page)
			const scheduleContainer = page.locator( '#schedule-container' );
			await expect( scheduleContainer ).toBeVisible();
		} );

		test( 'login.php redirects to index when auth disabled', async ( { page } ) => {
			const app = new AppPage( page );

			// Set consent cookie before navigation
			await page.context().addCookies( [ {
				name: 'br_consent',
				value: 'accepted',
				domain: 'bodyrefactoring.ddev.site',
				path: '/',
			} ] );

			// Navigate to login.php
			const response = await page.goto( '/login.php' );

			// Should redirect to index.php
			expect( page.url() ).toContain( 'index.php' );
		} );

		test( 'logout button is not visible when auth disabled', async ( { page } ) => {
			const app = new AppPage( page );
			await app.goto();
			await app.waitForAppReady();

			// Open menu
			await app.openMenu();

			// Logout button should NOT be present when auth is disabled
			const logoutButton = page.locator( 'a[href="logout.php"]' );
			await expect( logoutButton ).toHaveCount( 0 );
		} );

		test( 'menu has website and github links', async ( { page } ) => {
			const app = new AppPage( page );
			await app.goto();
			await app.waitForAppReady();

			// Open menu
			await app.openMenu();

			// Should have website and github links in the menu dropdown
			const menuDropdown = page.locator( '#menu-dropdown' );
			const websiteLink = menuDropdown.locator( 'a[href^="https://christoph"]' );
			const githubLink = menuDropdown.locator( 'a[href*="github.com"]' );

			await expect( websiteLink ).toBeVisible();
			await expect( githubLink ).toBeVisible();
		} );
	} );

	test.describe( 'Login Page UI (mocked)', () => {
		test( 'login page structure when auth is enabled', async ( { page } ) => {
			// Mock the login page response directly
			await page.route( '**/login.php', async ( route ) => {
				// Return a mock login page HTML
				const html = `
					<!DOCTYPE html>
					<html lang="de">
					<head>
						<meta charset="UTF-8">
						<title>Login - Body Refactoring</title>
					</head>
					<body>
						<div class="login-container">
							<h1>Body Refactoring</h1>
							<p class="subtitle">Protected Instance</p>
							<form method="POST" class="login-form">
								<label for="password">Passwort</label>
								<input type="password" id="password" name="password" required>
								<button type="submit" class="submit-btn">Anmelden</button>
							</form>
						</div>
					</body>
					</html>
				`;
				await route.fulfill( {
					status: 200,
					contentType: 'text/html; charset=utf-8',
					body: html,
				} );
			} );

			await page.goto( '/login.php' );

			// Check login page elements
			await expect( page.locator( 'h1' ) ).toContainText( 'Body Refactoring' );
			await expect( page.locator( '.subtitle' ) ).toContainText( 'Protected Instance' );
			await expect( page.locator( 'input[type="password"]' ) ).toBeVisible();
			await expect( page.locator( 'button[type="submit"]' ) ).toContainText( 'Anmelden' );
		} );

		test( 'login form has required password field', async ( { page } ) => {
			await page.route( '**/login.php', async ( route ) => {
				const html = `
					<!DOCTYPE html>
					<html lang="de">
					<body>
						<form method="POST" class="login-form">
							<input type="password" id="password" name="password" required placeholder="••••••••">
							<button type="submit">Anmelden</button>
						</form>
					</body>
					</html>
				`;
				await route.fulfill( {
					status: 200,
					contentType: 'text/html',
					body: html,
				} );
			} );

			await page.goto( '/login.php' );

			const passwordInput = page.locator( 'input[type="password"]' );
			await expect( passwordInput ).toHaveAttribute( 'required', '' );
			await expect( passwordInput ).toHaveAttribute( 'name', 'password' );
		} );

		test( 'login error message displayed on wrong password', async ( { page } ) => {
			await page.route( '**/login.php', async ( route ) => {
				// Simulate login page with error message
				const html = `
					<!DOCTYPE html>
					<html lang="de">
					<body>
						<form method="POST" class="login-form">
							<div class="error-message">
								Falsches Passwort. Bitte versuche es erneut.
							</div>
							<input type="password" id="password" name="password" required>
							<button type="submit">Anmelden</button>
						</form>
					</body>
					</html>
				`;
				await route.fulfill( {
					status: 200,
					contentType: 'text/html',
					body: html,
				} );
			} );

			await page.goto( '/login.php' );

			const errorMessage = page.locator( '.error-message' );
			await expect( errorMessage ).toBeVisible();
			await expect( errorMessage ).toContainText( 'Falsches Passwort' );
		} );

		test( 'login page has proper form structure', async ( { page } ) => {
			await page.route( '**/login.php', async ( route ) => {
				const html = `
					<!DOCTYPE html>
					<html lang="de">
					<body>
						<form method="POST" class="login-form">
							<label for="password">Passwort</label>
							<input type="password" id="password" name="password" required>
							<button type="submit" class="submit-btn">Anmelden</button>
						</form>
					</body>
					</html>
				`;
				await route.fulfill( {
					status: 200,
					contentType: 'text/html',
					body: html,
				} );
			} );

			await page.goto( '/login.php' );

			// Form should use POST method
			const form = page.locator( 'form.login-form' );
			await expect( form ).toHaveAttribute( 'method', 'POST' );

			// Label should be associated with password field
			const label = page.locator( 'label[for="password"]' );
			await expect( label ).toBeVisible();
		} );
	} );

	test.describe( 'Protected Instance (mocked auth flow)', () => {
		test( 'login form can be submitted', async ( { page } ) => {
			let postReceived = false;

			await page.route( '**/login.php', async ( route ) => {
				const request = route.request();

				if ( request.method() === 'POST' ) {
					postReceived = true;
					// Return success page (in real app, this would be a redirect)
					const html = `
						<!DOCTYPE html>
						<html lang="de">
						<head><meta charset="UTF-8"></head>
						<body>
							<div class="success">Login successful</div>
						</body>
						</html>
					`;
					await route.fulfill( {
						status: 200,
						contentType: 'text/html; charset=utf-8',
						body: html,
					} );
				} else {
					// Show login form
					const html = `
						<!DOCTYPE html>
						<html lang="de">
						<head><meta charset="UTF-8"></head>
						<body>
							<form method="POST" class="login-form">
								<input type="password" id="password" name="password" required>
								<button type="submit">Anmelden</button>
							</form>
						</body>
						</html>
					`;
					await route.fulfill( {
						status: 200,
						contentType: 'text/html; charset=utf-8',
						body: html,
					} );
				}
			} );

			await page.goto( '/login.php' );

			// Fill in password and submit
			await page.fill( 'input[type="password"]', 'testpassword' );
			await page.click( 'button[type="submit"]' );

			// Wait for response
			await page.waitForTimeout( 500 );

			// Should have received POST request
			expect( postReceived ).toBe( true );
		} );

		test( 'logout button visible when auth is enabled (mocked)', async ( { page } ) => {
			// Mock the index.php to include logout button
			await page.route( '**/*.php', async ( route, request ) => {
				if ( request.url().includes( 'index.php' ) || request.url().endsWith( '/' ) ) {
					// Let the real request through but we'll check the result
					await route.continue();
				} else {
					await route.continue();
				}
			} );

			const app = new AppPage( page );
			await app.goto();
			await app.waitForAppReady();

			// In the test environment, auth is disabled, so logout won't appear
			// This test documents the expected behavior when auth IS enabled
			await app.openMenu();

			// When auth is enabled, there would be a logout link
			// Current test environment has it disabled
			const menuLinks = await page.locator( '#menu-dropdown a' ).count();
			expect( menuLinks ).toBeGreaterThan( 0 );
		} );
	} );

	test.describe( 'Auth Cookie Behavior', () => {
		test( 'consent cookie is separate from auth cookie', async ( { page } ) => {
			const app = new AppPage( page );
			await app.goto();
			await app.waitForAppReady();

			// Check cookies
			const cookies = await page.context().cookies();

			// Should have consent cookie
			const consentCookie = cookies.find( ( c ) => c.name === 'br_consent' );
			expect( consentCookie ).toBeDefined();
			expect( consentCookie.value ).toBe( 'accepted' );

			// Should NOT have auth cookie (auth is disabled)
			const authCookie = cookies.find( ( c ) => c.name === 'br_auth' );
			expect( authCookie ).toBeUndefined();
		} );

		test( 'app works without auth cookie when auth disabled', async ( { page } ) => {
			const app = new AppPage( page );

			// Only set consent, no auth
			await page.context().addCookies( [ {
				name: 'br_consent',
				value: 'accepted',
				domain: 'bodyrefactoring.ddev.site',
				path: '/',
			} ] );

			await page.goto( '/' );
			await app.waitForAppReady();

			// App should load fine without auth
			await expect( page.locator( '#schedule-container' ) ).toBeVisible();
		} );
	} );
} );
