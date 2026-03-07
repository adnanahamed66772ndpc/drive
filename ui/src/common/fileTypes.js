export const IMAGE_EXT = new Set(
	'jpg jpeg png gif webp bmp svg ico'.split(' ')
)

/** Common video extensions (browser support: mp4, webm, ogg best) */
export const VIDEO_EXT = new Set(
	'mp4 webm ogg ogv mov m4v avi mkv 3gp 3g2 wmv'.split(' ')
)

export function getExt(fileName) {
	return fileName.includes('.')
		? fileName.split('.').pop().toLowerCase()
		: ''
}

export function isImageFile(fileName) {
	return IMAGE_EXT.has(getExt(fileName))
}

export function isVideoFile(fileName) {
	return VIDEO_EXT.has(getExt(fileName))
}
