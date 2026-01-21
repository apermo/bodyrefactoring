/**
 * Introduction Modal
 *
 * Handles the welcome/introduction modal for first-time visitors.
 * Uses DomainStorageService for state persistence.
 *
 * @package BodyRefactoring
 * @since 13.0.0
 */

/**
 * Check if user has seen the intro modal and show it if not.
 *
 * Checks domainStorage to see if intro was seen.
 * Shows modal with fade-in animation on first visit.
 *
 * @param {Object} domainStorage - DomainStorageService instance.
 * @return {void}
 */
export function checkAndShowIntroModal( domainStorage ) {
	// Check if user has seen intro
	if ( ! domainStorage.hasSeenIntroduction() ) {
		// Show modal after splash screen fades
		setTimeout( () => {
			const modal = document.getElementById( 'intro-modal' );
			if ( modal ) {
				modal.classList.remove( 'opacity-0', 'pointer-events-none' );
			}
		}, 1500 );
	}
}

/**
 * Close the introduction modal.
 *
 * Saves dismissal to storage via DomainStorageService,
 * triggers confetti celebration, and fades out the modal.
 *
 * @param {Object} domainStorage - DomainStorageService instance.
 * @return {void}
 */
export function closeIntroModal( domainStorage ) {
	// Mark as seen using domainStorage
	domainStorage.setIntroductionSeen();

	// Trigger confetti celebration
	if ( typeof confetti !== 'undefined' ) {
		confetti( {
			particleCount: 100,
			spread: 70,
			origin: { y: 0.6 },
		} );
	}

	// Fade out modal
	const modal = document.getElementById( 'intro-modal' );
	if ( modal ) {
		modal.classList.add( 'opacity-0', 'pointer-events-none' );
	}
}


