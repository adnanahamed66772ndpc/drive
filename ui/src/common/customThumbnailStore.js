const PREFIX = 'pentaract_thumb:'

export function getCustomThumbnailKey(storageId, path) {
	return PREFIX + storageId + ':' + path
}

export function getCustomThumbnail(storageId, path) {
	try {
		return localStorage.getItem(getCustomThumbnailKey(storageId, path))
	} catch {
		return null
	}
}

export function setCustomThumbnail(storageId, path, dataUrl) {
	try {
		localStorage.setItem(getCustomThumbnailKey(storageId, path), dataUrl)
		return true
	} catch {
		return false
	}
}

export function clearCustomThumbnail(storageId, path) {
	try {
		localStorage.removeItem(getCustomThumbnailKey(storageId, path))
		return true
	} catch {
		return false
	}
}
