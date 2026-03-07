import { createSignal } from 'solid-js'
import Typography from '@suid/material/Typography'
import Paper from '@suid/material/Paper'
import Stack from '@suid/material/Stack'
import Button from '@suid/material/Button'
import CircularProgress from '@suid/material/CircularProgress'
import BackupIcon from '@suid/icons-material/Backup'
import RestoreIcon from '@suid/icons-material/Restore'
import CloudDownloadIcon from '@suid/icons-material/CloudDownload'
import CloudUploadIcon from '@suid/icons-material/CloudUpload'

import API from '../../api'
import { alertStore } from '../../components/AlertStack'

const BackupRestore = () => {
	const [backupLoading, setBackupLoading] = createSignal(false)
	const [restoreLoading, setRestoreLoading] = createSignal(false)
	const handleBackup = async () => {
		setBackupLoading(true)
		try {
			const blob = await API.backup.downloadBackup()
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = `pentaract_backup_${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}.sql`
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			URL.revokeObjectURL(url)
			alertStore.addAlert('Backup downloaded', 'success')
		} catch (err) {
			// addAlert called by apiRequest
		} finally {
			setBackupLoading(false)
		}
	}

	const handleRestoreClick = () => {
		const input = document.createElement('input')
		input.type = 'file'
		input.accept = '.sql'
		input.onchange = async (e) => {
			const file = e.target.files?.[0]
			if (!file) return
			if (!confirm('Restore will overwrite ALL data. Continue?')) return
			setRestoreLoading(true)
			try {
				await API.backup.restoreBackup(file)
				alertStore.addAlert('Restore completed. Please refresh the page.', 'success')
			} catch {
				// addAlert called by apiMultipartRequest
			} finally {
				setRestoreLoading(false)
			}
		}
		input.click()
	}

	return (
		<Stack spacing={3}>
			<Typography variant="h4">Database Backup & Restore</Typography>
			<Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
				Backup downloads your database as SQL. Restore imports a backup file (this
				overwrites existing data).
			</Typography>

			<Paper sx={{ p: 3 }}>
				<Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
					<BackupIcon color="primary" />
					<Typography variant="h6">Backup</Typography>
				</Stack>
				<Typography variant="body2" sx={{ mb: 2 }}>
					Click to download a full database backup (.sql file).
				</Typography>
				<Button
					variant="contained"
					color="secondary"
					startIcon={
						backupLoading() ? (
							<CircularProgress size={20} color="inherit" />
						) : (
							<CloudDownloadIcon />
						)
					}
					onClick={handleBackup}
					disabled={backupLoading()}
				>
					{backupLoading() ? 'Backing up...' : 'Download Backup'}
				</Button>
			</Paper>

			<Paper sx={{ p: 3 }}>
				<Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
					<RestoreIcon color="primary" />
					<Typography variant="h6">Restore</Typography>
				</Stack>
				<Typography variant="body2" sx={{ mb: 2 }}>
					Upload a backup file (.sql) to restore the database. This overwrites
					all current data.
				</Typography>
				<Button
					variant="contained"
					color="secondary"
					startIcon={
						restoreLoading() ? (
							<CircularProgress size={20} color="inherit" />
						) : (
							<CloudUploadIcon />
						)
					}
					onClick={handleRestoreClick}
					disabled={restoreLoading()}
				>
					{restoreLoading() ? 'Restoring...' : 'Upload & Restore'}
				</Button>
				<Typography variant="caption" color="error.main" sx={{ mt: 1, display: 'block' }}>
					Restore will overwrite all data. Make sure you have a backup.
				</Typography>
			</Paper>
		</Stack>
	)
}

export default BackupRestore
