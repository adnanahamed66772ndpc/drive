import { useBeforeLeave, useNavigate, useParams } from '@solidjs/router'
import { Show, createSignal, createMemo, mapArray, onCleanup, onMount } from 'solid-js'
import MenuItem from '@suid/material/MenuItem'
import ListItemIcon from '@suid/material/ListItemIcon'
import ListItemText from '@suid/material/ListItemText'
import UploadFileIcon from '@suid/icons-material/UploadFile'
import DriveFolderUploadIcon from '@suid/icons-material/DriveFolderUpload'
import FolderOpenIcon from '@suid/icons-material/FolderOpen'
import LockIcon from '@suid/icons-material/Lock'
import Grid from '@suid/material/Grid'
import Stack from '@suid/material/Stack'
import Typography from '@suid/material/Typography'
import ToggleButton from '@suid/material/ToggleButton'
import ToggleButtonGroup from '@suid/material/ToggleButtonGroup'
import Fab from '@suid/material/Fab'
import AddIcon from '@suid/icons-material/Add'
import ViewModuleIcon from '@suid/icons-material/ViewModule'
import ViewListIcon from '@suid/icons-material/ViewList'
import SearchIcon from '@suid/icons-material/Search'
import InputAdornment from '@suid/material/InputAdornment'
import TextField from '@suid/material/TextField'
import Box from '@suid/material/Box'

import API from '../../api'
import FSListItem from '../../components/FSListItem'
import Breadcrumbs from '../../components/Breadcrumbs'
import Menu from '../../components/Menu'
import CreateFolderDialog from '../../components/CreateFolderDialog'
import { alertStore } from '../../components/AlertStack'
import Access from '../../components/Access'
import GrantAccess from '../../components/GrantAccess'

const Files = () => {
	const { addAlert } = alertStore
	const [fsLayer, setFsLayer] = createSignal([])
	const [storage, setStorage] = createSignal()
	const [isAccessPage, setIsAccessPage] = createSignal(false)
	const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] =
		createSignal(false)
	const [isGrantAccessButtonVisible, setIsGrantButtonAccessVisible] =
		createSignal(false)
	const [isGrantAccessVisible, setIsGrantAccessVisible] = createSignal(false)
	const [users, setUsers] = createSignal([])
	const [viewMode, setViewMode] = createSignal('grid') // 'grid' | 'list'
	const [searchQuery, setSearchQuery] = createSignal('')
	const [isDragOver, setIsDragOver] = createSignal(false)
	const navigate = useNavigate()
	const params = useParams()
	const basePath = `/storages/${params.id}/files`

	let uploadFileInputElement

	const fetchUsersWithAccess = async () => {
		try {
			const users = await API.access.listUsersWithAccess(params.id)
			setUsers(users)
			setIsGrantButtonAccessVisible(true)
		} catch (err) {
			addAlert('You do not have permissions to manage access', 'error')
			console.error(err)
			setIsGrantButtonAccessVisible(false)
		}
	}

	const fetchStorage = async () => {
		const storage = await API.storages.getStorage(params.id)
		setStorage(storage)
	}

	const fetchFSLayer = async (path = params.path) => {
		const fsLayerRes = await API.files.getFSLayer(params.id, path)

		if (path.length) {
			const parentPath = path.split('/').slice(0, -1).join('/')
			const backToParent = { is_file: false, name: '..', path: parentPath }

			fsLayerRes.splice(0, 0, backToParent)
		}

		setFsLayer(fsLayerRes)
	}

	const reload = async () => {
		if (window.location.pathname.startsWith(basePath)) {
			await fetchFSLayer()
		}
	}

	onMount(() => {
		Promise.all([fetchStorage(), fetchFSLayer()]).then()
		window.addEventListener('popstate', reload, false)
	})

	onCleanup(() => window.removeEventListener('popstate', reload, false))

	useBeforeLeave(async (e) => {
		if (e.to.startsWith(basePath)) {
			let newPath = e.to.slice(basePath.length)
			if (newPath.startsWith('/')) {
				newPath = newPath.slice(1)
			}
			await fetchFSLayer(newPath)
		}
	})

	const openCreateFolderDialog = () => {
		setIsCreateFolderDialogOpen(true)
	}
	const closeCreateFolderDialog = () => {
		setIsCreateFolderDialogOpen(false)
	}

	const createFolder = async (folderName) => {
		const base = params.path.endsWith('/')
			? params.path.slice(0, -1)
			: params.path

		await API.files.createFolder(params.id, base, folderName)
		addAlert(`Created folder "${folderName}"`, 'success')
		await fetchFSLayer()
	}

	const uploadFileClickHandler = () => {
		uploadFileInputElement.click()
	}

	const uploadFile = async (event) => {
		const file = event.target.files[0]
		if (file === undefined) {
			return
		}
		event.target.value = null

		await API.files.uploadFile(params.id, params.path, file)
		addAlert(`Uploaded file "${file.name}"`, 'success')
		await fetchFSLayer()
	}

	const uploadFiles = async (files) => {
		const fileList = Array.from(files).filter((f) => f.isFile && f.size > 0)
		if (fileList.length === 0) return
		for (const file of fileList) {
			try {
				await API.files.uploadFile(params.id, params.path, file)
				addAlert(`Uploaded "${file.name}"`, 'success')
			} catch (err) {
				addAlert(`Failed to upload "${file.name}"`, 'error')
			}
		}
		await fetchFSLayer()
	}

	const handleRename = async (oldPath, newPath) => {
		await API.files.renameFile(params.id, oldPath, newPath)
		addAlert('Renamed successfully', 'success')
		await fetchFSLayer()
	}

	const handleDrop = (e) => {
		e.preventDefault()
		setIsDragOver(false)
		if (e.dataTransfer?.files?.length) {
			uploadFiles(e.dataTransfer.files)
		}
	}

	const handleDragOver = (e) => {
		e.preventDefault()
		setIsDragOver(true)
		e.dataTransfer.dropEffect = 'copy'
	}

	const handleDragLeave = (e) => {
		e.preventDefault()
		setIsDragOver(false)
	}

	const filteredAndSortedLayer = createMemo(() => {
		let items = fsLayer()
		const q = searchQuery().toLowerCase().trim()
		if (q) {
			items = items.filter((el) => el.name.toLowerCase().includes(q))
		}
		items = [...items].sort((a, b) => {
			if (a.name === '..') return -1
			if (b.name === '..') return 1
			if (!a.is_file && b.is_file) return -1
			if (a.is_file && !b.is_file) return 1
			return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
		})
		return items
	})

	return (
		<>
			<Stack container>
				<Grid container sx={{ mb: 2 }}>
					<Grid item xs={4}>
						<Typography variant="h4">{storage()?.name}</Typography>
					</Grid>

					<Grid item xs={4}>
						<ToggleButtonGroup
							exclusive
							value={isAccessPage()}
							color="primary"
							onChange={(_, val) => setIsAccessPage(val)}
							sx={{ display: 'flex', justifyContent: 'center' }}
						>
							<ToggleButton value={false}>
								<FolderOpenIcon fontSize="small" />
								&nbsp; Files
							</ToggleButton>
							<ToggleButton value={true}>
								<LockIcon fontSize="small" />
								&nbsp; Access
							</ToggleButton>
						</ToggleButtonGroup>
					</Grid>

					<Grid
						item
						xs={4}
						sx={{ display: 'flex', justifyContent: 'flex-end' }}
					>
						<Show
							when={!isAccessPage()}
							fallback={
								<Show when={isGrantAccessButtonVisible()}>
									<Fab
										variant="extended"
										color="secondary"
										onClick={() => setIsGrantAccessVisible(true)}
									>
										<AddIcon sx={{ mr: 1 }} />
										Grant access
									</Fab>
									<GrantAccess
										isVisible={isGrantAccessVisible()}
										afterGrant={fetchUsersWithAccess}
										onClose={() => setIsGrantAccessVisible(false)}
									/>
								</Show>
							}
						>
							<Menu button_title="Create">
								<MenuItem onClick={openCreateFolderDialog}>
									<ListItemIcon>
										<DriveFolderUploadIcon />
									</ListItemIcon>
									<ListItemText>Create folder</ListItemText>
								</MenuItem>
								<MenuItem onClick={uploadFileClickHandler}>
									<ListItemIcon>
										<UploadFileIcon />
									</ListItemIcon>
									<ListItemText>Upload file</ListItemText>
								</MenuItem>
								<MenuItem
									onClick={() => navigate(`/storages/${params.id}/upload_to`)}
								>
									<ListItemIcon>
										<UploadFileIcon />
									</ListItemIcon>
									<ListItemText>Upload file to</ListItemText>
								</MenuItem>
							</Menu>
						</Show>
					</Grid>
				</Grid>

				<Show
					when={!isAccessPage()}
					fallback={
						<Access
							setIsGrantAccessVisible={setIsGrantAccessVisible}
							users={users()}
							onMount={fetchUsersWithAccess}
							refetchUsers={fetchUsersWithAccess}
						/>
					}
				>
					<Breadcrumbs
						storageId={params.id}
						storageName={storage()?.name}
						path={params.path || ''}
						basePath={basePath}
					/>

					<Grid container spacing={1} sx={{ mb: 2 }}>
						<Grid item xs={12} sm={6} md={4}>
							<TextField
								fullWidth
								size="small"
								placeholder="Search files and folders..."
								value={searchQuery()}
								onInput={(e) => setSearchQuery(e.target.value)}
								slotProps={{
									input: {
										startAdornment: (
											<InputAdornment position="start">
												<SearchIcon fontSize="small" />
											</InputAdornment>
										),
									},
								}}
								sx={{ maxWidth: 360 }}
							/>
						</Grid>
						<Grid item xs={12} sm={6} md={4}>
							<ToggleButtonGroup
								value={viewMode()}
								exclusive
								onChange={(_, v) => v && setViewMode(v)}
								size="small"
							>
								<ToggleButton value="grid" aria-label="Grid view">
									<ViewModuleIcon />
								</ToggleButton>
								<ToggleButton value="list" aria-label="List view">
									<ViewListIcon />
								</ToggleButton>
							</ToggleButtonGroup>
						</Grid>
					</Grid>

					<Box
						onDrop={handleDrop}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						sx={{
							outline: isDragOver()
								? '2px dashed'
								: '1px solid transparent',
							outlineColor: isDragOver() ? 'primary.main' : 'transparent',
							borderRadius: 2,
							minHeight: 120,
							transition: 'outline 0.2s',
						}}
					>
						<Show when={filteredAndSortedLayer().length} fallback={<Typography color="text.secondary">No files yet</Typography>}>
							<Grid
								container
								spacing={1}
								sx={{
									maxWidth: viewMode() === 'list' ? 800 : 1200,
									mx: 'auto',
									py: 1,
								}}
							>
								{mapArray(filteredAndSortedLayer, (fsElement) => (
									<Grid
										item
										xs={viewMode() === 'list' ? 12 : 6}
										sm={viewMode() === 'list' ? 12 : 4}
										md={viewMode() === 'list' ? 12 : 3}
									>
										<FSListItem
											fsElement={fsElement}
											storageId={params.id}
											view={viewMode()}
											onDelete={fetchFSLayer}
											onRename={handleRename}
										/>
									</Grid>
								))}
							</Grid>
						</Show>
					</Box>

					<CreateFolderDialog
						isOpened={isCreateFolderDialogOpen()}
						onCreate={createFolder}
						onClose={closeCreateFolderDialog}
					/>
					<input
						ref={uploadFileInputElement}
						type="file"
						style="display: none"
						onChange={uploadFile}
					/>
				</Show>
			</Stack>
		</>
	)
}

export default Files
