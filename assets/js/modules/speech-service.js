/**
 * Speech Service
 *
 * Text-to-speech service with voice selection and error handling.
 * Handles German voice synthesis with natural speech settings.
 *
 * @package BodyRefactoring
 * @since 13.0.0
 */

/**
 * Speech Service class.
 *
 * Manages text-to-speech functionality with queue management and voice preferences.
 */
export class SpeechService {
	/**
	 * Constructor.
	 */
	constructor() {
		this.isAvailable = 'speechSynthesis' in window;
		this.voicesLoaded = false;
		this.queue = [];
		this.isProcessing = false;

		if ( this.isAvailable ) {
			this.initVoices();
		}
	}

	/**
	 * Initialize voice loading.
	 *
	 * @return {void}
	 */
	initVoices() {
		// Load voices
		window.speechSynthesis.getVoices();

		// Set up voice change listener (voices load async on some browsers)
		if ( ! window.speechSynthesis.onvoiceschanged ) {
			window.speechSynthesis.onvoiceschanged = () => {
				this.voicesLoaded = true;
			};
		}
	}

	/**
	 * Get available German voices.
	 *
	 * @return {SpeechSynthesisVoice[]} Array of German voices.
	 */
	getGermanVoices() {
		if ( ! this.isAvailable ) {
			return [];
		}

		const voices = window.speechSynthesis.getVoices();
		return voices.filter( ( voice ) => voice.lang.startsWith( 'de' ) );
	}

	/**
	 * Select the best German voice.
	 *
	 * Prefers specific voice names for better quality.
	 *
	 * @return {SpeechSynthesisVoice|null} Selected voice or null.
	 */
	selectBestVoice() {
		const germanVoices = this.getGermanVoices();

		if ( germanVoices.length === 0 ) {
			return null;
		}

		// Preferred voice names (in order of preference)
		const preferredNames = [ 'Anna', 'Helena', 'Markus', 'Google Deutsch' ];

		// Try to find preferred voice
		for ( const name of preferredNames ) {
			const voice = germanVoices.find( ( v ) => v.name.includes( name ) );
			if ( voice ) {
				return voice;
			}
		}

		// Fallback to first German voice
		return germanVoices[ 0 ];
	}

	/**
	 * Speak text.
	 *
	 * @param {string} text - Text to speak.
	 * @param {Object} options - Speech options.
	 * @return {Promise<void>} Resolves when speech completes.
	 */
	speak( text, options = {} ) {
		if ( ! this.isAvailable ) {
			console.warn( '[SpeechService] Speech synthesis not available' );
			return Promise.resolve();
		}

		return new Promise( ( resolve, reject ) => {
			// Cancel any ongoing speech to prevent conflicts
			if ( window.speechSynthesis.speaking ) {
				window.speechSynthesis.cancel();
			}

			const utterance = new SpeechSynthesisUtterance( text );
			utterance.lang = options.lang || 'de-DE';
			utterance.rate = options.rate || 0.95;
			utterance.pitch = options.pitch || 1.0;
			utterance.volume = options.volume || 0.9;

			// Wait for voices to load
			if ( ! this.voicesLoaded ) {
				const checkVoices = setInterval( () => {
					const voices = window.speechSynthesis.getVoices();
					if ( voices.length > 0 ) {
						clearInterval( checkVoices );
						this.voicesLoaded = true;
						this.speakUtterance( utterance, resolve, reject );
					}
				}, 100 );

				// Timeout after 3 seconds
				setTimeout( () => {
					clearInterval( checkVoices );
					this.speakUtterance( utterance, resolve, reject );
				}, 3000 );
			} else {
				this.speakUtterance( utterance, resolve, reject );
			}
		} );
	}

	/**
	 * Speak an utterance with voice selection.
	 *
	 * @param {SpeechSynthesisUtterance} utterance - Utterance to speak.
	 * @param {Function} resolve - Promise resolve function.
	 * @param {Function} reject - Promise reject function.
	 * @return {void}
	 */
	speakUtterance( utterance, resolve, reject ) {
		const voice = this.selectBestVoice();
		if ( voice ) {
			utterance.voice = voice;
		}

		utterance.onend = () => {
			resolve();
		};

		utterance.onerror = ( error ) => {
			console.error( '[SpeechService] Speech error:', error );
			reject( error );
		};

		try {
			window.speechSynthesis.speak( utterance );
		} catch ( error ) {
			console.error( '[SpeechService] Failed to speak:', error );
			reject( error );
		}
	}

	/**
	 * Cancel all speech.
	 *
	 * @return {void}
	 */
	cancel() {
		if ( this.isAvailable ) {
			window.speechSynthesis.cancel();
		}
	}

	/**
	 * Pause speech.
	 *
	 * @return {void}
	 */
	pause() {
		if ( this.isAvailable ) {
			window.speechSynthesis.pause();
		}
	}

	/**
	 * Resume speech.
	 *
	 * @return {void}
	 */
	resume() {
		if ( this.isAvailable ) {
			window.speechSynthesis.resume();
		}
	}

	/**
	 * Check if currently speaking.
	 *
	 * @return {boolean} True if speaking.
	 */
	isSpeaking() {
		return this.isAvailable && window.speechSynthesis.speaking;
	}

	/**
	 * Convert timer label to spoken German.
	 *
	 * Expands abbreviations like "Min" to "Minuten" and "s" to "Sekunden".
	 *
	 * @param {string} label - Timer label.
	 * @return {string} Spoken version.
	 */
	convertTimerLabel( label ) {
		return label
			.replace( /\bMin\b/g, 'Minuten' )
			.replace( /(\d+)s\b/g, '$1 Sekunden' );
	}

	/**
	 * Speak with automatic abbreviation conversion.
	 *
	 * @param {string} text - Text to speak (may contain abbreviations).
	 * @param {Object} options - Speech options.
	 * @return {Promise<void>} Resolves when speech completes.
	 */
	speakWithConversion( text, options = {} ) {
		const spokenText = this.convertTimerLabel( text );
		return this.speak( spokenText, options );
	}
}

