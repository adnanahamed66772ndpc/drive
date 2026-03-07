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
import InfoIcon from '@suid/icons-material/Info'
import DeleteIcon from '@suid/icons-material/Delete'
import { createSignal, onCleanup, Show } from 'solid-js'
import { useNavigate, useParams } from '@solidjs/router'

import API from '../api'
import { isImageFile } from '../common/fileTypes'
import ActionConfirmDialog from './ActionConfirmDialog'
import FileInfoDialog from './FileInfo'
import FilePreviewDialog from './FilePreviewDialog'
import FileThumbnail from './FileThumbnail'

/**
 * @typedef {Object} FSListItemProps
 * @property {import("../api").FSElement} fsElement
 * @property {string} storageId
 * @property {() => {}} onDelete
 */

/**
 *
 * @param {FSListItemProps} props
 * @returns
 */
const FSListItem = (props) => {
	const [moreAnchorEl, setMoreAnchorEl] = createSignal(null)
	const [isActionConfirmDialogOpened, setIsActionConfirmDialogOpened] =
		createSignal(false)
	const [isInfoDialogOpened, setIsInfoDialogOpened] = createSignal(false)
	const [isPreviewDialogOpened, setIsPreviewDialogOpened] = createSignal(false)
	const navigate = useNavigate()
	const params = useParams()

	const openMore = () => Boolean(moreAnchorEl())

	const handleCloseMore = () => {
		setMoreAnchorEl(null)
	}

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

	const deleteFile = async () => {
		closeActionConfirmDialog()
		await API.files.deleteFile(params.id, props.fsElement.path)
		props.onDelete()
	}

	const isImage = () =>
		props.fsElement.is_file && isImageFile(props.fsElement.name)
	const ICON_SIZE = 80

	return (
		<>
			<Paper
				elevation={0}
				sx={{
					display: 'flex',
					alignItems: 'flex-start',
					gap: 0.5,
					p: 1,
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
						flexDirection: 'column',
						alignItems: 'center',
						cursor: 'pointer',
						textAlign: 'center',
					}}
				>
					<Box sx={{ position: 'relative' }}>
						<Show
							when={props.fsElement.is_file}
							fallback={
								<Box
									sx={{
										width: ICON_SIZE,
										height: ICON_SIZE,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										bgcolor: 'action.hover',
										borderRadius: 1,
									}}
								>
									<FolderIcon sx={{ fontSize: 48 }} color="primary" />
								</Box>
							}
						>
							<Show
								when={isImage()}
								fallback={
									<Box
										sx={{
											width: ICON_SIZE,
											height: ICON_SIZE,
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											bgcolor: 'action.hover',
											borderRadius: 1,
										}}
									>
										<FileIcon sx={{ fontSize: 48 }} color="action" />
									</Box>
								}
							>
								<FileThumbnail
									storageId={props.storageId}
									path={props.fsElement.path}
									fileName={props.fsElement.name}
									size={ICON_SIZE}
								/>
							</Show>
						</Show>
					</Box>
					<Typography
						variant="body2"
						sx={{
							mt: 0.5,
							px: 0.5,
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
							maxWidth: ICON_SIZE + 24,
						}}
					>
						{props.fsElement.name}
					</Typography>
				</Box>
				<IconButton
					size="small"
					onClick={(e) => {
						e.stopPropagation()
						setMoreAnchorEl(e.currentTarget)
					}}
				>
					<MoreVertIcon fontSize="small" />
				</IconButton>
			</Paper>

			<MenuMUI
				id="basic-menu"
				anchorEl={moreAnchorEl()}
				open={openMore()}
				onClose={handleCloseMore}
				MenuListProps={{ 'aria-labelledby': 'basic-button' }}
			>
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
			</MenuMUI>

			<ActionConfirmDialog
				action="Delete"
				entity="file"
				actionDescription={`delete file ${props.fsElement.name}`}
				isOpened={isActionConfirmDialogOpened()}
				onConfirm={deleteFile}
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
