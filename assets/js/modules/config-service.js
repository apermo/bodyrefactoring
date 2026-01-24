/**
 * Configuration Service
 *
 * Provides access to application configuration loaded from JSON files.
 * Supports test configuration overrides for Playwright testing.
 *
 * @package BodyRefactoring
 * @since 14.7.0
 */

/**
 * Configuration Service class.
 *
 * Handles loading and accessing configuration values with dot-notation paths.
 * Prioritizes test overrides > custom config > default config.
 */
class ConfigService {
	/**
	 * Merged configuration object.
	 *
	 * @type {Object}
	 */
	#config;

	/**
	 * Create a ConfigService instance.
	 *
	 * Priority: TEST_CONFIG_OVERRIDE > APP_CONFIG > empty object
	 */
	constructor() {
		// Test config takes priority (set by Playwright tests)
		if ( window.TEST_CONFIG_OVERRIDE ) {
			this.#config = this.#deepMerge(
				window.APP_CONFIG || {},
				window.TEST_CONFIG_OVERRIDE,
			);
		} else {
			this.#config = window.APP_CONFIG || {};
		}
	}

	/**
	 * Deep merge two objects.
	 *
	 * @param {Object} target - Base object.
	 * @param {Object} source - Object to merge in.
	 * @return {Object} Merged object.
	 */
	#deepMerge( target, source ) {
		const result = { ...target };

		for ( const key in source ) {
			if ( Object.prototype.hasOwnProperty.call( source, key ) ) {
				if (
					source[ key ] &&
					typeof source[ key ] === 'object' &&
					! Array.isArray( source[ key ] )
				) {
					result[ key ] = this.#deepMerge(
						result[ key ] || {},
						source[ key ],
					);
				} else {
					result[ key ] = source[ key ];
				}
			}
		}

		return result;
	}

	/**
	 * Get a configuration value by dot-notation path.
	 *
	 * @param {string} path         - Dot-notation path (e.g., 'theme.colors.primary').
	 * @param {*}      defaultValue - Default value if path not found.
	 * @return {*} The configuration value or default.
	 */
	get( path, defaultValue = null ) {
		const keys = path.split( '.' );
		let current = this.#config;

		for ( const key of keys ) {
			if ( current === null || current === undefined ) {
				return defaultValue;
			}
			if ( typeof current !== 'object' || ! ( key in current ) ) {
				return defaultValue;
			}
			current = current[ key ];
		}

		return current ?? defaultValue;
	}

	/**
	 * Get a localized string.
	 *
	 * @param {string} key          - String key in dot notation (e.g., 'menu.logout').
	 * @param {Object} replacements - Key-value pairs for placeholder replacement.
	 * @return {string} The localized string with replacements applied.
	 */
	getString( key, replacements = {} ) {
		let value = this.get( `strings.${ key }`, key );

		if ( typeof value !== 'string' ) {
			return key;
		}

		// Replace {placeholder} patterns
		for ( const [ placeholder, replacement ] of Object.entries( replacements ) ) {
			value = value.replace(
				new RegExp( `\\{${ placeholder }\\}`, 'g' ),
				replacement,
			);
		}

		return value;
	}

	/**
	 * Get a theme color.
	 *
	 * @param {string} key - Color key (e.g., 'primary', 'background').
	 * @return {string|null} The color value or null.
	 */
	getColor( key ) {
		return this.get( `theme.colors.${ key }`, null );
	}

	/**
	 * Check if a feature is enabled.
	 *
	 * @param {string} feature - Feature name (e.g., 'speechEnabled').
	 * @return {boolean} True if feature is enabled.
	 */
	isFeatureEnabled( feature ) {
		return Boolean( this.get( `features.${ feature }`, false ) );
	}

	/**
	 * Get a default value.
	 *
	 * @param {string} key          - Default key (e.g., 'timerDuration').
	 * @param {*}      defaultValue - Fallback if not found.
	 * @return {*} The default value.
	 */
	getDefault( key, defaultValue = null ) {
		return this.get( `defaults.${ key }`, defaultValue );
	}

	/**
	 * Get all quotes from configuration.
	 *
	 * @return {string[]} Array of quote strings.
	 */
	getQuotes() {
		return this.get( 'strings.quotes', [] );
	}

	/**
	 * Get a random quote from configuration.
	 *
	 * @return {string} A random quote or empty string.
	 */
	getRandomQuote() {
		const quotes = this.getQuotes();
		if ( quotes.length === 0 ) {
			return '';
		}
		return quotes[ Math.floor( Math.random() * quotes.length ) ];
	}

	/**
	 * Get the full configuration object.
	 *
	 * @return {Object} The full configuration.
	 */
	getAll() {
		return { ...this.#config };
	}

	/**
	 * Replace Tailwind classes based on config mapping.
	 *
	 * @param {string} html - HTML string with Tailwind classes.
	 * @return {string} HTML with replaced class names.
	 */
	replaceTailwindClasses( html ) {
		const mapping = this.get( 'tailwind', {} );

		if ( ! mapping || Object.keys( mapping ).length === 0 ) {
			return html;
		}

		// Sort by key length descending to replace longer matches first
		const sortedKeys = Object.keys( mapping ).sort(
			( a, b ) => b.length - a.length,
		);

		let result = html;
		for ( const from of sortedKeys ) {
			const to = mapping[ from ];
			// Replace class names with word boundaries
			const pattern = new RegExp(
				`(?<=\\s|"|'|^)${ from.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ) }(?=\\s|"|'|$)`,
				'g',
			);
			result = result.replace( pattern, to );
		}

		return result;
	}

	/**
	 * Template tag for HTML with Tailwind class replacement.
	 *
	 * Usage: configService.tw`<div class="bg-slate-800">...</div>`
	 *
	 * @param {string[]} strings - Template strings.
	 * @param {...*}     values  - Template values.
	 * @return {string} Processed HTML string.
	 */
	tw( strings, ...values ) {
		const html = strings.reduce(
			( result, str, i ) => result + str + ( values[ i ] ?? '' ),
			'',
		);
		return this.replaceTailwindClasses( html );
	}
}

// Create and export singleton instance
const configService = new ConfigService();

export { ConfigService, configService };
export default configService;
