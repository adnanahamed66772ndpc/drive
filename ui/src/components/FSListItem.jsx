import Box from '@suid/material/Box'
import ListItemIcon from '@suid/material/ListItemIcon'
import ListItemText from '@suid/material/ListItemText'
import MenuMUI from '@suid/material/Menu'
import MenuItem from '@suid/material/MenuItem'
import IconButton from '@suid/material/IconButton'
import Paper from '@suid/material/Paper'
import Typography from '@suid/material/Typography'
import FileIcon from '@suid/icons-material/InsertDriveFileOutlined'
import FolderIcon from '@suid/icons-material/Folder'
import MoreVertIcon from '@suid/icons-material/MoreVert'
import DownloadIcon from '@suid/icons-material/Download'
import VisibilityIcon from '@suid/icons-material/Visibility'
import ImageIcon from '@suid/icons-material/Image'
import InfoIcon from '@suid/icons-material/Info'
import DeleteIcon from '@suid/icons-material/Delete'
import ClearIcon from '@suid/icons-material/Clear'
import DriveFileRenameOutlineIcon from '@suid/icons-material/DriveFileRenameOutline'
import { createSignal, onCleanup, Show } from 'solid-js'
import { useNavigate, useParams } from '@solidjs/router'

import API from '../api'
import { alertStore } from '../components/AlertStack'
import { isImageFile, isVideoFile } from '../common/fileTypes'
import {
	getCustomThumbnail,
	setCustomThumbnail,
	clearCustomThumbnail,
} from '../common/customThumbnailStore'
import ActionConfirmDialog from './ActionConfirmDialog'
import RenameDialog from './RenameDialog'
import FileInfoDialog from './FileInfo'
import FilePreviewDialog from './FilePreviewDialog'
import FileThumbnail from './FileThumbnail'
import VideoThumbnail from './VideoThumbnail'

/**
 * @typedef {Object} FSListItemProps
 * @property {import("../api").FSElement} fsElement
 * @property {string} storageId
 * @property {() => void} onDelete
 * @property {() => void} [onRename]
 * @property {'grid' | 'list'} [view]
 */

/**
 *
 * @param {FSListItemProps} props
 * @returns
 */
const FSListItem = (props) => {
	const [moreAnchorEl, setMoreAnchorEl] = createSignal(null)
	const [contextMenuPos, setContextMenuPos] = createSignal(null)
	const [isActionConfirmDialogOpened, setIsActionConfirmDialogOpened] =
		createSignal(false)
	const [isRenameDialogOpened, setIsRenameDialogOpened] = createSignal(false)
	const [isInfoDialogOpened, setIsInfoDialogOpened] = createSignal(false)
	const [isPreviewDialogOpened, setIsPreviewDialogOpened] = createSignal(false)
	const [thumbVersion, setThumbVersion] = createSignal(0)
	const navigate = useNavigate()
	const params = useParams()

	const customThumb = () => {
		thumbVersion()
		return getCustomThumbnail(props.storageId, props.fsElement.path)
	}

	const openMore = () => Boolean(moreAnchorEl())
	const openContextMenu = () => contextMenuPos() !== null

	const handleCloseMore = () => {
		setMoreAnchorEl(null)
	}
	const handleCloseContextMenu = () => setContextMenuPos(null)

	const handleNavigate = () => {
		if (!props.fsElement.is_file) {
			navigate(`/storages/${props.storageId}/files/${props.fsElement.path}`)
		}
	}

	const download = async () => {
		const blob = await API.files.download(params.id, props.fsElement.path)

		const href = URL.createObjectURL(blob)
		const a = Object.assign(document.createElement('a'), {
			href,
			style: 'display: none',
			download: props.fsElement.name,
		})
		document.body.appendChild(a)

		a.click()
		URL.revokeObjectURL(href)
		a.remove()
	}

	const openActionConfirmDialog = () => {
		handleCloseMore()
		setIsActionConfirmDialogOpened(true)
	}
	const closeActionConfirmDialog = () => {
		setIsActionConfirmDialogOpened(false)
	}

	const deleteItem = async () => {
		closeActionConfirmDialog()
		const path =
			props.fsElement.is_file || props.fsElement.path.endsWith('/')
				? props.fsElement.path
				: props.fsElement.path + '/'
		await API.files.deleteFile(params.id, path)
		alertStore.addAlert('Deleted from app and Telegram', 'success')
		props.onDelete()
	}

	const isImage = () =>
		props.fsElement.is_file && isImageFile(props.fsElement.name)
	const isVideo = () =>
		props.fsElement.is_file && isVideoFile(props.fsElement.name)
	const ICON_SIZE = () => (props.view === 'list' ? 40 : 80)

	let setThumbInputEl
	const openSetThumbnail = () => {
		handleCloseMore()
		setThumbInputEl?.click()
	}
	const onSetThumbnailChange = (e) => {
		const file = e.target.files?.[0]
		e.target.value = ''
		if (!file || !file.type.startsWith('image/')) return
		const reader = new FileReader()
		reader.onload = () => {
			const dataUrl = reader.result
			if (setCustomThumbnail(props.storageId, props.fsElement.path, dataUrl)) {
				setThumbVersion((v) => v + 1)
			}
		}
		reader.readAsDataURL(file)
	}
	const clearThumbnail = () => {
		handleCloseMore()
		clearCustomThumbnail(props.storageId, props.fsElement.path)
		setThumbVersion((v) => v + 1)
	}

	const openRenameDialog = () => {
		handleCloseMore()
		handleCloseContextMenu()
		setIsRenameDialogOpened(true)
	}

	const closeRenameDialog = () => setIsRenameDialogOpened(false)

	const renameItem = async (newName) => {
		closeRenameDialog()
		if (!props.onRename) return
		const oldPath = props.fsElement.path
		const basePath = oldPath.replace(/[^/]+\/?$/, '') || ''
		const newPath = props.fsElement.is_file
			? basePath + newName.trim()
			: basePath + newName.trim() + '/'
		await props.onRename(oldPath, newPath)
	}

	const handleContextMenu = (e) => {
		e.preventDefault()
		if (props.fsElement.name === '..') return
		setContextMenuPos({ x: e.clientX, y: e.clientY })
	}

	const openMenu = (e) => {
		e.stopPropagation()
		if (props.fsElement.name === '..') return
		setMoreAnchorEl(e.currentTarget)
	}

	const isListView = () => props.view === 'list'

	return (
		<>
			<Paper
				elevation={0}
				onContextMenu={handleContextMenu}
				sx={{
					display: 'flex',
					flexDirection: isListView() ? 'row' : 'column',
					alignItems: isListView() ? 'center' : 'flex-start',
					gap: 0.5,
					p: isListView() ? 0.5 : 1,
					minWidth: 0,
					borderRadius: 1,
					'&:hover': { bgcolor: 'action.hover' },
				}}
			>
				<Box
					onClick={() => {
						if (props.fsElement.is_file) {
							setIsPreviewDialogOpened(true)
						} else {
							handleNavigate()
						}
					}}
					sx={{
						flex: 1,
						minWidth: 0,
						display: 'flex',
						flexDirection: isListView() ? 'row' : 'column',
						alignItems: isListView() ? 'center' : 'center',
						gap: isListView() ? 1.5 : 0,
						cursor: 'pointer',
						textAlign: isListView() ? 'left' : 'center',
					}}
				>
					<Box sx={{ position: 'relative', flexShrink: 0 }}>
						<Show when={customThumb()}>
							<Box
								component="img"
								src={customThumb()}
								alt=""
								sx={{
									width: ICON_SIZE(),
									height: ICON_SIZE(),
									objectFit: 'cover',
									borderRadius: 1,
								}}
							/>
						</Show>
						<Show when={!customThumb() && !props.fsElement.is_file}>
							<Box
								sx={{
									width: ICON_SIZE(),
									height: ICON_SIZE(),
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									bgcolor: 'action.hover',
									borderRadius: 1,
								}}
							>
								<FolderIcon sx={{ fontSize: ICON_SIZE() * 0.6 }} color="primary" />
							</Box>
						</Show>
						<Show when={!customThumb() && props.fsElement.is_file && isImage()}>
							<FileThumbnail
								storageId={props.storageId}
								path={props.fsElement.path}
								fileName={props.fsElement.name}
								size={ICON_SIZE()}
							/>
						</Show>
						<Show when={!customThumb() && props.fsElement.is_file && isVideo()}>
							<VideoThumbnail
								storageId={props.storageId}
								path={props.fsElement.path}
								fileName={props.fsElement.name}
								size={ICON_SIZE()}
							/>
						</Show>
						<Show
							when={
								!customThumb() &&
								props.fsElement.is_file &&
								!isImage() &&
								!isVideo()
							}
						>
							<Box
								sx={{
									width: ICON_SIZE(),
									height: ICON_SIZE(),
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									bgcolor: 'action.hover',
									borderRadius: 1,
								}}
							>
								<FileIcon sx={{ fontSize: ICON_SIZE() * 0.6 }} color="action" />
							</Box>
						</Show>
					</Box>
					<Typography
						variant="body2"
						sx={{
							mt: isListView() ? 0 : 0.5,
							px: 0.5,
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
							maxWidth: isListView() ? 'none' : ICON_SIZE() + 24,
						}}
					>
						{props.fsElement.name}
					</Typography>
				</Box>
				<Show when={props.fsElement.name !== '..'}>
					<IconButton size="small" onClick={openMenu}					>
						<MoreVertIcon fontSize="small" />
					</IconButton>
				</Show>
			</Paper>

			<MenuMUI
				id="context-menu"
				anchorEl={moreAnchorEl()}
				anchorReference={contextMenuPos() ? 'anchorPosition' : 'anchorEl'}
				anchorPosition={
					contextMenuPos()
						? { top: contextMenuPos().y, left: contextMenuPos().x }
						: undefined
				}
				open={openMore() || openContextMenu()}
				onClose={() => {
					handleCloseMore()
					handleCloseContextMenu()
				}}
				MenuListProps={{ 'aria-labelledby': 'basic-button' }}
			>
				<MenuItem onClick={openRenameDialog}>
					<ListItemIcon>
						<DriveFileRenameOutlineIcon fontSize="small" />
					</ListItemIcon>
					<ListItemText>Rename</ListItemText>
				</MenuItem>
				<MenuItem onClick={() => setIsInfoDialogOpened(true)}>
					<ListItemIcon>
						<InfoIcon fontSize="small" />
					</ListItemIcon>
					<ListItemText>Info</ListItemText>
				</MenuItem>

				<MenuItem
					onClick={() => {
						handleCloseMore()
						setIsPreviewDialogOpened(true)
					}}
					disabled={!props.fsElement.is_file}
				>
					<ListItemIcon>
						<VisibilityIcon fontSize="small" />
					</ListItemIcon>
					<ListItemText>Preview</ListItemText>
				</MenuItem>

				<MenuItem onClick={download} disabled={!props.fsElement.is_file}>
					<ListItemIcon>
						<DownloadIcon fontSize="small" />
					</ListItemIcon>
					<ListItemText>Download</ListItemText>
				</MenuItem>

				<MenuItem onClick={openActionConfirmDialog}>
					<ListItemIcon>
						<DeleteIcon fontSize="small" />
					</ListItemIcon>
					<ListItemText>Delete</ListItemText>
				</MenuItem>
				<MenuItem onClick={openSetThumbnail}>
					<ListItemIcon>
						<ImageIcon fontSize="small" />
					</ListItemIcon>
					<ListItemText>Set thumbnail / icon</ListItemText>
				</MenuItem>
				<Show when={customThumb()}>
					<MenuItem onClick={clearThumbnail}>
						<ListItemIcon>
							<ClearIcon fontSize="small" />
						</ListItemIcon>
						<ListItemText>Clear thumbnail</ListItemText>
					</MenuItem>
				</Show>
			</MenuMUI>
			<input
				ref={(el) => (setThumbInputEl = el)}
				type="file"
				accept="image/*"
				style="display: none"
				onChange={onSetThumbnailChange}
			/>

			<RenameDialog
				isOpened={isRenameDialogOpened()}
				currentName={props.fsElement.name}
				entity={props.fsElement.is_file ? 'file' : 'folder'}
				onRename={renameItem}
				onClose={closeRenameDialog}
			/>

			<ActionConfirmDialog
				action="Delete"
				entity={props.fsElement.is_file ? 'file' : 'folder'}
				actionDescription={`delete ${props.fsElement.is_file ? 'file' : 'folder'} ${props.fsElement.name}${props.fsElement.is_file ? '' : ' and its contents'}`}
				isOpened={isActionConfirmDialogOpened()}
				onConfirm={deleteItem}
				onCancel={closeActionConfirmDialog}
			/>

			<FileInfoDialog
				file={props.fsElement}
				isOpened={isInfoDialogOpened()}
				onClose={() => setIsInfoDialogOpened(false)}
			/>

			<FilePreviewDialog
				fileName={props.fsElement.name}
				storageId={params.id}
				path={props.fsElement.path}
				isOpened={isPreviewDialogOpened()}
				onClose={() => setIsPreviewDialogOpened(false)}
			/>
		</>
	)
}

export default FSListItem
