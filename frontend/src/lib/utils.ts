// Shared utility functions

import type { FamilyColor } from './types';

const ARTICLES = ['the', 'a', 'an'];

/**
 * Get monogram letter from a name, skipping common articles
 * e.g., "The Gusa's" -> "G", "A Family" -> "F", "Smith" -> "S"
 */
export function getMonogram(name: string): string {
	const words = name.trim().split(/\s+/);
	for (const word of words) {
		if (!ARTICLES.includes(word.toLowerCase())) {
			return word.charAt(0).toUpperCase();
		}
	}
	// Fallback to first character if all words are articles
	return name.charAt(0).toUpperCase();
}

/**
 * Get Tailwind gradient classes for a family color
 */
export function getFamilyColorClasses(color: FamilyColor): {
	gradient: string;
	bg: string;
	text: string;
	light: string;
} {
	const colors: Record<FamilyColor, { gradient: string; bg: string; text: string; light: string }> = {
		orange: {
			gradient: 'from-orange-400 to-orange-600',
			bg: 'bg-orange-500',
			text: 'text-orange-600',
			light: 'from-orange-100 to-orange-200',
		},
		blue: {
			gradient: 'from-blue-400 to-blue-600',
			bg: 'bg-blue-500',
			text: 'text-blue-600',
			light: 'from-blue-100 to-blue-200',
		},
		purple: {
			gradient: 'from-purple-400 to-purple-600',
			bg: 'bg-purple-500',
			text: 'text-purple-600',
			light: 'from-purple-100 to-purple-200',
		},
		green: {
			gradient: 'from-green-400 to-green-600',
			bg: 'bg-green-500',
			text: 'text-green-600',
			light: 'from-green-100 to-green-200',
		},
		rose: {
			gradient: 'from-rose-400 to-rose-600',
			bg: 'bg-rose-500',
			text: 'text-rose-600',
			light: 'from-rose-100 to-rose-200',
		},
		amber: {
			gradient: 'from-amber-400 to-amber-600',
			bg: 'bg-amber-500',
			text: 'text-amber-600',
			light: 'from-amber-100 to-amber-200',
		},
	};
	return colors[color] || colors.orange;
}
