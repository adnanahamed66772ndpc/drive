import Typography from '@suid/material/Typography'
import Box from '@suid/material/Box'
import Paper from '@suid/material/Paper'
import Stack from '@suid/material/Stack'
import BackupIcon from '@suid/icons-material/Backup'
import RestoreIcon from '@suid/icons-material/Restore'

const BackupRestore = () => {
	return (
		<Stack spacing={3}>
			<Typography variant="h4">Database Backup & Restore</Typography>
			<Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
				Backup and restore the PostgreSQL database. Run these commands on your
				server (VPS) where Docker is running.
			</Typography>

			<Paper sx={{ p: 3 }}>
				<Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
					<BackupIcon color="primary" />
					<Typography variant="h6">Backup</Typography>
				</Stack>
				<Typography variant="body2" sx={{ mb: 2 }}>
					Creates a timestamped SQL file in <code>backups/</code>:
				</Typography>
				<Box
					component="pre"
					sx={{
						p: 2,
						bgcolor: 'action.hover',
						borderRadius: 1,
						overflow: 'auto',
						fontSize: '0.875rem',
					}}
				>
					<code>make backup</code>
					{'\n\n'}
					<code># Or: ./scripts/backup.sh</code>
					{'\n'}
					<code># Windows: .\scripts\backup.ps1</code>
				</Box>
				<Typography variant="caption" color="text.secondary">
					Ensure the pentaract_db container is running.
				</Typography>
			</Paper>

			<Paper sx={{ p: 3 }}>
				<Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
					<RestoreIcon color="primary" />
					<Typography variant="h6">Restore</Typography>
				</Stack>
				<Typography variant="body2" sx={{ mb: 2 }}>
					Imports from a backup file. This will overwrite existing data.
				</Typography>
				<Box
					component="pre"
					sx={{
						p: 2,
						bgcolor: 'action.hover',
						borderRadius: 1,
						overflow: 'auto',
						fontSize: '0.875rem',
					}}
				>
					<code>
						make restore FILE=backups/pentaract_YYYYMMDD_HHMMSS.sql
					</code>
					{'\n\n'}
					<code># Or: ./scripts/restore.sh backups/pentaract_*.sql</code>
					{'\n'}
					<code># Windows: .\scripts\restore.ps1 backups\pentaract_*.sql</code>
				</Box>
				<Typography variant="caption" color="error.main">
					Restore will overwrite all data. A 5-second warning appears before
					proceeding.
				</Typography>
			</Paper>

			<Paper sx={{ p: 3, bgcolor: 'info.main', color: 'info.contrastText' }}>
				<Typography variant="subtitle2" sx={{ mb: 1 }}>
					SSH to your server first
				</Typography>
				<Typography variant="body2">
					If deployed via Docker, SSH into your VPS, go to the project directory
					(usually <code>/var/www/drive</code>), then run the commands above.
				</Typography>
			</Paper>
		</Stack>
	)
}

export default BackupRestore
