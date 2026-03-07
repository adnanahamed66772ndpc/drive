import Dialog from '@suid/material/Dialog'
import DialogContent from '@suid/material/DialogContent'
import DialogTitle from '@suid/material/DialogTitle'
import Typography from '@suid/material/Typography'
import CircularProgress from '@suid/material/CircularProgress'
import Box from '@suid/material/Box'
import { createSignal, createEffect, onCleanup, Show } from 'solid-js'

import API from '../api'
import { IMAGE_EXT, VIDEO_EXT, getExt } from '../common/fileTypes'

const TEXT_EXT = new Set(
	'txt md csv json xml yaml yml log html htm css js ts jsx tsx'.split(' ')
)

/**
 * @typedef {Object} FilePreviewDialogProps
 * @property {string} fileName
 * @property {string} storageId
 * @property {string} path
 * @property {boolean} isOpened
 * @property {() => void} onClose
 */

/**
 * @param {FilePreviewDialogProps} props
 */
const FilePreviewDialog = (props) => {
	const [status, setStatus] = createSignal('idle') // 'idle' | 'loading' | 'ok' | 'error'
	const [objectUrl, setObjectUrl] = createSignal(null)
	const [textContent, setTextContent] = createSignal('')
	const [previewType, setPreviewType] = createSignal(null) // 'image' | 'pdf' | 'text' | 'video' | 'unsupported'
	const [errorMessage, setErrorMessage] = createSignal('')

	const ext = () => getExt(props.fileName)

	createEffect(() => {
		if (!props.isOpened) {
			const url = objectUrl()
			if (url) {
				URL.revokeObjectURL(url)
				setObjectUrl(null)
			}
			setStatus('idle')
			setPreviewType(null)
			setTextContent('')
			setErrorMessage('')
			return
		}
		let cancelled = false
		const extVal = ext()

		if (IMAGE_EXT.has(extVal)) {
			setPreviewType('image')
		} else if (extVal === 'pdf') {
			setPreviewType('pdf')
		} else if (VIDEO_EXT.has(extVal)) {
			setPreviewType('video')
		} else if (TEXT_EXT.has(extVal)) {
			setPreviewType('text')
		} else {
			setStatus('ok')
			setPreviewType('unsupported')
			return
		}

		setStatus('loading')
		setErrorMessage('')

		const type = IMAGE_EXT.has(extVal)
			? 'image'
			: extVal === 'pdf'
				? 'pdf'
				: VIDEO_EXT.has(extVal)
					? 'video'
					: 'text'

		API.files
			.download(props.storageId, props.path)
			.then((blob) => {
				if (cancelled) return
				if (type === 'text') {
					blob.text().then((t) => {
						if (!cancelled) {
							setTextContent(t)
							setStatus('ok')
						}
					})
				} else {
					const url = URL.createObjectURL(blob)
					setObjectUrl(url)
					setStatus('ok')
				}
			})
			.catch((err) => {
				if (!cancelled) {
					setErrorMessage(err?.message || 'Failed to load file')
					setStatus('error')
				}
			})

		onCleanup(() => {
			cancelled = true
		})
	})

	return (
		<Dialog
			open={props.isOpened}
			onClose={props.onClose}
			maxWidth="md"
			fullWidth
			PaperProps={{
				sx: { minHeight: '60vh' },
			}}
		>
			<DialogTitle sx={{ textAlign: 'center' }}>
				Preview: {props.fileName}
			</DialogTitle>
			<DialogContent>
				<Show when={status() === 'loading'}>
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
						<CircularProgress />
					</Box>
				</Show>
				<Show when={status() === 'error'}>
					<Typography color="error">{errorMessage()}</Typography>
				</Show>
				<Show when={status() === 'ok' && previewType() === 'unsupported'}>
					<Typography color="text.secondary">
						Preview not available for this file type.
					</Typography>
				</Show>
				<Show when={status() === 'ok' && previewType() === 'image' && objectUrl()}>
					<Box
						component="img"
						src={objectUrl()}
						alt={props.fileName}
						sx={{
							maxWidth: '100%',
							height: 'auto',
							display: 'block',
							mx: 'auto',
						}}
					/>
				</Show>
				<Show when={status() === 'ok' && previewType() === 'pdf' && objectUrl()}>
					<Box
						component="iframe"
						src={objectUrl()}
						title={props.fileName}
						sx={{
							width: '100%',
							minHeight: '70vh',
							border: 'none',
						}}
					/>
				</Show>
				<Show when={status() === 'ok' && previewType() === 'video' && objectUrl()}>
					<Box
						component="video"
						src={objectUrl()}
						controls
						playsInline
						sx={{
							width: '100%',
							maxHeight: '70vh',
							display: 'block',
							mx: 'auto',
						}}
					/>
				</Show>
				<Show when={status() === 'ok' && previewType() === 'text'}>
					<Box
						component="pre"
						sx={{
							whiteSpace: 'pre-wrap',
							wordBreak: 'break-word',
							maxHeight: '70vh',
							overflow: 'auto',
							p: 1,
							bgcolor: 'action.hover',
							borderRadius: 1,
						}}
					>
						{textContent()}
					</Box>
				</Show>
			</DialogContent>
		</Dialog>
	)
}

export default FilePreviewDialog
