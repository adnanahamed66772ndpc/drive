import Box from '@suid/material/Box'
import { createSignal, createEffect, onCleanup, onMount } from 'solid-js'
import FileIcon from '@suid/icons-material/InsertDriveFileOutlined'
import { Show } from 'solid-js'
import API from '../api'

const thumbnailCache = new Map()

/**
 * Lazy-loads and shows image thumbnail when in view. Falls back to file icon.
 * @param {{ storageId: string, path: string, fileName: string, size?: number }} props
 */
const FileThumbnail = (props) => {
	const size = () => props.size ?? 80
	const [objectUrl, setObjectUrl] = createSignal(null)
	const [loaded, setLoaded] = createSignal(false)
	const [error, setError] = createSignal(false)
	const [inView, setInView] = createSignal(false)
	let el

	onMount(() => {
		const elRef = el
		if (!elRef) return
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) setInView(true)
			},
			{ rootMargin: '100px', threshold: 0.01 }
		)
		observer.observe(elRef)
		onCleanup(() => observer.disconnect())
	})

	createEffect(() => {
		if (!inView() || loaded() || error()) return
		const key = `${props.storageId}:${props.path}`
		const cached = thumbnailCache.get(key)
		if (cached) {
			setObjectUrl(cached)
			setLoaded(true)
			return
		}
		let cancelled = false
		API.files
			.download(props.storageId, props.path)
			.then((blob) => {
				if (cancelled) return
				const url = URL.createObjectURL(blob)
				thumbnailCache.set(key, url)
				setObjectUrl(url)
				setLoaded(true)
			})
			.catch(() => {
				if (!cancelled) setError(true)
			})
		onCleanup(() => {
			cancelled = true
		})
	})

	return (
		<Box
			ref={el}
			sx={{
				width: size() + 'px',
				height: size() + 'px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				bgcolor: 'action.hover',
				borderRadius: 1,
				overflow: 'hidden',
				flexShrink: 0,
			}}
		>
			<Show when={loaded() && objectUrl() && !error()}>
				<Box
					component="img"
					src={objectUrl()}
					alt=""
					sx={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
					}}
				/>
			</Show>
			<Show when={!loaded() || error()}>
				<FileIcon sx={{ fontSize: size() * 0.5 }} color="action" />
			</Show>
		</Box>
	)
}

export default FileThumbnail
