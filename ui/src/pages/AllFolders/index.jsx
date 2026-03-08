import Typography from '@suid/material/Typography'
import Grid from '@suid/material/Grid'
import Stack from '@suid/material/Stack'
import Box from '@suid/material/Box'
import Paper from '@suid/material/Paper'
import FolderIcon from '@suid/icons-material/Folder'
import { Show, createSignal, mapArray, onMount } from 'solid-js'
import { useNavigate } from '@solidjs/router'

import API from '../../api'

/**
 * @typedef {Object} FolderWithStorage
 * @property {string} storageId
 * @property {string} storageName
 * @property {string} path
 * @property {string} name
 */

const AllFolders = () => {
	/**
	 * @type {[import("solid-js").Accessor<FolderWithStorage[]>, any]}
	 */
	const [folders, setFolders] = createSignal([])
	const [loading, setLoading] = createSignal(true)
	const navigate = useNavigate()

	onMount(async () => {
		try {
			const { storages } = await API.storages.listStorages()
			const all = []
			for (const s of storages) {
				try {
					const items = await API.files.getFSLayer(s.id, '')
					for (const item of items) {
						if (!item.is_file && item.name !== '..') {
							all.push({
								storageId: s.id,
								storageName: s.name,
								path: item.path,
								name: item.name,
							})
						}
					}
				} catch {
					// skip storage if tree fails
				}
			}
			setFolders(all)
		} finally {
			setLoading(false)
		}
	})

	return (
		<Stack container>
			<Grid container sx={{ mb: 2 }}>
				<Grid item xs={12}>
					<Typography variant="h4">All folders</Typography>
					<Typography variant="body2" color="text.secondary">
						Root-level folders from all storages
					</Typography>
				</Grid>
			</Grid>

			<Grid>
				<Show when={loading()} fallback={null}>
					<Typography>Loading…</Typography>
				</Show>
				<Show when={!loading() && folders().length === 0}>
					<Typography color="text.secondary">No folders yet</Typography>
				</Show>
				<Show when={!loading() && folders().length > 0}>
					<Grid container spacing={1} sx={{ maxWidth: 900, py: 1 }}>
						{mapArray(folders, (folder) => {
							const folderPath = (folder.path || folder.name).replace(/\/?$/, '/')
							return (
								<Grid item xs={6} sm={4} md={3}>
									<Paper
										elevation={0}
										onClick={() =>
											navigate(
												`/storages/${folder.storageId}/files/${folderPath}`
											)
										}
										sx={{
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'center',
											p: 1,
											cursor: 'pointer',
											borderRadius: 1,
											'&:hover': { bgcolor: 'action.hover' },
										}}
									>
										<Box
											sx={{
												width: 80,
												height: 80,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												bgcolor: 'action.hover',
												borderRadius: 1,
												overflow: 'hidden',
											}}
										>
											<FolderIcon sx={{ fontSize: 48 }} color="primary" />
										</Box>
										<Typography
											variant="body2"
											sx={{
												mt: 0.5,
												textAlign: 'center',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap',
												maxWidth: '100%',
											}}
										>
											{folder.name}
										</Typography>
										<Typography
											variant="caption"
											color="text.secondary"
											sx={{
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap',
												maxWidth: '100%',
											}}
										>
											{folder.storageName}
										</Typography>
									</Paper>
								</Grid>
							)
						})}
					</Grid>
				</Show>
			</Grid>
		</Stack>
	)
}

export default AllFolders
